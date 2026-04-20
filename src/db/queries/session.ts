import { eq } from 'drizzle-orm';

import { db, schema } from '../client';
import type { NewSession, Session } from '../schema';

export async function getSession(): Promise<Session | null> {
  const rows = await db
    .select()
    .from(schema.session)
    .where(eq(schema.session.id, 1))
    .limit(1);

  return rows[0] ?? null;
}

export async function upsertSession(session: NewSession) {
  const values: NewSession = {
    id: 1,
    googleUserId: session.googleUserId,
    email: session.email,
    name: session.name ?? null,
    avatarUrl: session.avatarUrl ?? null,
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    createdAt: session.createdAt,
  };

  await db
    .insert(schema.session)
    .values(values)
    .onConflictDoUpdate({
      target: schema.session.id,
      set: values,
    });
}

export async function clearSession() {
  await db.delete(schema.session).where(eq(schema.session.id, 1));
}
