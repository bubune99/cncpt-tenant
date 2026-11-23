// The shared far-cms screens sync the signed-in user at /api/auth/sync (hooks/use-auth). CNCPT answers there with its
// own sync, the same contract ({ user: { id, stackAuthId, email, name, role } }), rather than the package's.
// The handler checks the session itself (401 without one). Card 10 (c645e053).
export const dynamic = 'force-dynamic'
export { GET, POST } from '../../cms/auth/sync/route'
