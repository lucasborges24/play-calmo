import { eq } from 'drizzle-orm';

import { db, schema } from '../client';
import type { Settings } from '../schema';

export async function getSettings(): Promise<Settings> {
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.id, 1))
    .limit(1);

  const row = rows[0];

  if (!row) {
    throw new Error('Settings row not found. Seed should have created id=1.');
  }

  return row;
}

export async function updateSettings(patch: Partial<Settings>) {
  const values = Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => key !== 'id' && value !== undefined),
  ) as Partial<Settings>;

  if (Object.keys(values).length === 0) {
    return getSettings();
  }

  await db.update(schema.settings).set(values).where(eq(schema.settings.id, 1));

  return getSettings();
}
