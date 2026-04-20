import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db, schema } from '@/db/client';
import { clearSession, getSession, upsertSession } from '@/db/queries/session';
import { deleteRefreshToken, getRefreshToken, saveRefreshToken } from '@/shared/lib/secure-storage';
import { revokeToken } from './token-exchange';

export function useSession() {
  const { data } = useLiveQuery(db.select().from(schema.session).limit(1));
  return data?.[0] ?? null;
}

export async function persistSession(params: {
  profile: { sub: string; email: string; name?: string; picture?: string };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}) {
  await saveRefreshToken(params.refreshToken);
  await upsertSession({
    id: 1,
    googleUserId: params.profile.sub,
    email: params.profile.email,
    name: params.profile.name ?? null,
    avatarUrl: params.profile.picture ?? null,
    accessToken: params.accessToken,
    accessTokenExpiresAt: params.expiresAt,
    createdAt: Date.now(),
  });
}

export async function signOut() {
  const session = await getSession();
  const refresh = await getRefreshToken();
  if (refresh) await revokeToken(refresh).catch(() => {});
  if (session?.accessToken) await revokeToken(session.accessToken).catch(() => {});
  await deleteRefreshToken();
  await clearSession();
}

export async function deleteAccountLocally() {
  await signOut();
  await db.delete(schema.dailyPlanVideos);
  await db.delete(schema.dailyPlans);
  await db.delete(schema.videos);
  await db.delete(schema.subscriptions);
  await db.delete(schema.jobRuns);
  await db
    .update(schema.settings)
    .set({ lastJobRunAt: null, lastSubsSyncAt: null });
}
