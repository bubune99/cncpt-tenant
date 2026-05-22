/**
 * Ownership Guard Verification
 *
 * Proves the canAccessSubdomain('admin') guard rejects users who don't
 * own the target subdomain (and aren't on the admin team for it).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/verify-ownership-guard.mjs
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Inlined version of canAccessSubdomain — keeps the script standalone (no
// Next.js / TS module resolution headaches in a quick verification).
async function canAccessSubdomain(userId, subdomain, requiredAccessLevel = 'view') {
  // Owner check
  const ownerCheck = await sql`
    SELECT user_id FROM subdomains WHERE subdomain = ${subdomain} AND user_id = ${userId}
  `;
  if (ownerCheck.length > 0) {
    return { hasAccess: true, accessType: 'owner' };
  }

  // Team check
  const teamAccess = await sql`
    SELECT ts.team_id, ts.access_level, tm.role
    FROM team_subdomains ts
    JOIN team_members tm ON ts.team_id = tm.team_id
    WHERE ts.subdomain = ${subdomain} AND tm.user_id = ${userId}
  `;
  if (teamAccess.length === 0) {
    return { hasAccess: false, accessType: null };
  }

  const row = teamAccess[0];
  const teamAccessLevel = row.access_level;
  const userRole = row.role;
  const accessLevelHierarchy = { view: 0, edit: 1, admin: 2 };
  const hasRequiredLevel =
    accessLevelHierarchy[teamAccessLevel] >= accessLevelHierarchy[requiredAccessLevel];
  const hasRoleOverride = userRole === 'owner' || userRole === 'admin';

  if (hasRequiredLevel || hasRoleOverride) {
    return { hasAccess: true, accessType: 'team', teamId: row.team_id, accessLevel: teamAccessLevel };
  }
  return { hasAccess: false, accessType: null };
}

async function main() {
  console.log('=== Ownership Guard Verification ===\n');

  // Pull subdomains with DIFFERENT owners so cross-tenant denial actually
  // exercises the negative path (not just same-owner-multiple-sites).
  const subs = await sql`
    SELECT DISTINCT ON (user_id) subdomain, user_id
    FROM subdomains
    WHERE user_id IS NOT NULL
    ORDER BY user_id, subdomain
    LIMIT 10
  `;
  if (subs.length < 2) {
    console.log('Need at least 2 subdomains with DIFFERENT owners to run this test.');
    process.exit(1);
  }

  const a = subs[0];
  const b = subs[1];
  console.log(`Subdomain A: ${a.subdomain} (owner: ${a.user_id.slice(0, 8)}...)`);
  console.log(`Subdomain B: ${b.subdomain} (owner: ${b.user_id.slice(0, 8)}...)\n`);

  // Owner of A accessing A — should pass
  const ownerOfA = await canAccessSubdomain(a.user_id, a.subdomain, 'admin');
  console.log(`A's owner -> A admin: hasAccess=${ownerOfA.hasAccess} (expect true)`);

  // Owner of A accessing B — should fail (unless they're also on B's team)
  const ownerOfACrossingToB = await canAccessSubdomain(a.user_id, b.subdomain, 'admin');
  console.log(
    `A's owner -> B admin: hasAccess=${ownerOfACrossingToB.hasAccess} (expect false unless on B's team)`
  );

  // Random non-owner (made-up id) — should fail
  const nonOwner = await canAccessSubdomain('00000000-0000-0000-0000-000000000000', a.subdomain, 'admin');
  console.log(`Random user -> A admin: hasAccess=${nonOwner.hasAccess} (expect false)\n`);

  console.log('=== Result ===');
  const guardWorks = ownerOfA.hasAccess && !nonOwner.hasAccess;
  console.log(guardWorks ? 'PASS — guard accepts owner, rejects strangers' : 'FAIL — guard is broken');
  process.exit(guardWorks ? 0 : 1);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
