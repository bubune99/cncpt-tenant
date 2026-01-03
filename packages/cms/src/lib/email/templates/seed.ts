/**
 * Email Template Seeder
 *
 * Seeds default email templates into the database.
 * Can be run via API endpoint or CLI script.
 */

import { prisma } from '../../db';
import { Prisma } from '@prisma/client';
import { defaultEmailTemplates } from './defaults';

export interface SeedResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Seed default email templates
 *
 * @param overwrite - If true, updates existing templates. If false, skips existing.
 */
export async function seedEmailTemplates(overwrite = false): Promise<SeedResult> {
  const result: SeedResult = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const template of defaultEmailTemplates) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: template.slug },
      });

      if (existing) {
        if (overwrite) {
          await prisma.emailTemplate.update({
            where: { slug: template.slug },
            data: {
              name: template.name,
              description: template.description,
              category: template.category,
              subject: template.subject,
              preheader: template.preheader,
              content: template.content as Prisma.InputJsonValue,
              isSystem: true,
              isActive: true,
            },
          });
          result.created++;
        } else {
          result.skipped++;
        }
      } else {
        await prisma.emailTemplate.create({
          data: {
            slug: template.slug,
            name: template.name,
            description: template.description,
            category: template.category,
            subject: template.subject,
            preheader: template.preheader,
            content: template.content as Prisma.InputJsonValue,
            isSystem: true,
            isActive: true,
          },
        });
        result.created++;
      }
    } catch (error) {
      result.errors.push(
        `Error seeding template "${template.slug}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}

/**
 * Reset all system templates to defaults
 */
export async function resetSystemTemplates(): Promise<SeedResult> {
  // Delete all system templates
  await prisma.emailTemplate.deleteMany({
    where: { isSystem: true },
  });

  // Re-seed with overwrite
  return seedEmailTemplates(true);
}

/**
 * Check if templates need seeding
 */
export async function needsSeeding(): Promise<boolean> {
  const count = await prisma.emailTemplate.count({
    where: { isSystem: true },
  });
  return count < defaultEmailTemplates.length;
}
