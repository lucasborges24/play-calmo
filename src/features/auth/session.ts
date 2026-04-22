import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Platform } from 'react-native';

import type { Session } from '@/db/schema';
import { db, schema } from '@/db/client';
import { clearSession, getSession, upsertSession } from '@/db/queries/session';
import { warn as logWarn } from '@/shared/lib/logger';
import { deleteRefreshToken, getRefreshToken, saveRefreshToken } from '@/shared/lib/secure-storage';
import {
  nativeGoogleSignOut,
  refreshNativeGoogleAccessToken,
  restoreNativeGoogleSession,
} from './google-native';
import { fetchUserProfile, refreshAccessToken, revokeToken } from './token-exchange';

const EXPIRY_BUFFER_MS = 60_000;

let refreshPromise: Promise<Session> | null = null;

export type SessionAuthFailureReason =
  | 'missing_session'
  | 'missing_refresh_token'
  | 'native_session_missing'
  | 'refresh_failed'
  | 'refresh_token_revoked'
  | 'unauthorized_after_refresh';

export class SessionAuthError extends Error {
  constructor(
    message: string,
    public readonly reason: SessionAuthFailureReason,
    public readonly terminal: boolean,
  ) {
    super(message);
    this.name = 'SessionAuthError';
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown authentication error';
}

function toSessionAuthError(error: unknown): SessionAuthError {
  if (error instanceof SessionAuthError) {
    return error;
  }

  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('not authenticated')) {
    return new SessionAuthError(message, 'missing_session', true);
  }

  if (normalized.includes('no refresh token')) {
    return new SessionAuthError(message, 'missing_refresh_token', true);
  }

  if (normalized.includes('no native google session')) {
    return new SessionAuthError(message, 'native_session_missing', true);
  }

  if (
    normalized.includes('invalid_grant') ||
    normalized.includes('invalid_rapt') ||
    normalized.includes('token has been expired or revoked') ||
    normalized.includes('revoked') ||
    normalized.includes('unauthorized_client')
  ) {
    return new SessionAuthError(message, 'refresh_token_revoked', true);
  }

  return new SessionAuthError(message, 'refresh_failed', false);
}

function buildSessionRecord(params: {
  profile: { sub: string; email: string; name?: string; picture?: string };
  accessToken: string;
  expiresAt: number;
  createdAt?: number;
}): Session {
  return {
    id: 1,
    googleUserId: params.profile.sub,
    email: params.profile.email,
    name: params.profile.name ?? null,
    avatarUrl: params.profile.picture ?? null,
    accessToken: params.accessToken,
    accessTokenExpiresAt: params.expiresAt,
    createdAt: params.createdAt ?? Date.now(),
  };
}

async function clearLocalSession(options: { clearNativeSession?: boolean } = {}) {
  if (options.clearNativeSession && Platform.OS === 'android') {
    await nativeGoogleSignOut().catch(() => {});
  }

  await deleteRefreshToken();
  await clearSession();
}

async function restoreSessionFromStoredCredentials(): Promise<Session | null> {
  if (Platform.OS === 'android') {
    const restored = await restoreNativeGoogleSession();
    if (!restored) {
      return null;
    }

    const nextSession = buildSessionRecord(restored);
    await persistSession(restored);
    return nextSession;
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const nextTokens = await refreshAccessToken(refreshToken);
  const profile = await fetchUserProfile(nextTokens.accessToken);
  const nextSession = buildSessionRecord({
    profile,
    accessToken: nextTokens.accessToken,
    expiresAt: nextTokens.expiresAt,
  });

  await persistSession({
    profile,
    accessToken: nextTokens.accessToken,
    refreshToken,
    expiresAt: nextTokens.expiresAt,
  });

  return nextSession;
}

async function refreshPersistedSession(session: Session): Promise<Session> {
  if (Platform.OS === 'android') {
    const next = await refreshNativeGoogleAccessToken();
    const nextSession = {
      ...session,
      accessToken: next.accessToken,
      accessTokenExpiresAt: next.expiresAt,
    };
    await upsertSession(nextSession);
    return nextSession;
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new SessionAuthError('No refresh token', 'missing_refresh_token', true);
  }

  const next = await refreshAccessToken(refreshToken);
  const nextSession = {
    ...session,
    accessToken: next.accessToken,
    accessTokenExpiresAt: next.expiresAt,
  };

  await upsertSession(nextSession);
  return nextSession;
}

export function useSessionState() {
  const { data } = useLiveQuery(db.select().from(schema.session).limit(1));

  return {
    session: data?.[0] ?? null,
    isLoaded: data !== undefined,
  };
}

export function useSession() {
  return useSessionState().session;
}

export async function persistSession(params: {
  profile: { sub: string; email: string; name?: string; picture?: string };
  accessToken: string;
  refreshToken?: string | null;
  expiresAt: number;
}) {
  if (params.refreshToken) {
    await saveRefreshToken(params.refreshToken);
  } else {
    await deleteRefreshToken();
  }

  await upsertSession(buildSessionRecord(params));
}

export function isTerminalSessionAuthError(error: unknown) {
  return toSessionAuthError(error).terminal;
}

export async function clearSessionAfterAuthFailure(error: unknown, context: string) {
  const authError = toSessionAuthError(error);

  logWarn('Clearing session after auth failure', {
    context,
    reason: authError.reason,
    error: authError,
  });

  await clearLocalSession({ clearNativeSession: true });
}

export async function refreshSessionTokens(options: {
  forceRefresh?: boolean;
  allowRestore?: boolean;
} = {}): Promise<Session> {
  let session = await getSession();

  if (!session && options.allowRestore) {
    session = await restoreSessionFromStoredCredentials();
  }

  if (!session) {
    throw new SessionAuthError('Not authenticated', 'missing_session', true);
  }

  if (!options.forceRefresh && session.accessTokenExpiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return session;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await refreshPersistedSession(session);
      } catch (error) {
        throw toSessionAuthError(error);
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function getValidAccessToken(options: {
  forceRefresh?: boolean;
  allowRestore?: boolean;
} = {}) {
  const session = await refreshSessionTokens(options);
  return session.accessToken;
}

export async function bootstrapSession() {
  const session = await getSession();

  try {
    if (!session) {
      return await restoreSessionFromStoredCredentials();
    }

    if (session.accessTokenExpiresAt <= Date.now() + EXPIRY_BUFFER_MS) {
      return await refreshSessionTokens();
    }

    return session;
  } catch (error) {
    const authError = toSessionAuthError(error);

    if (authError.terminal) {
      await clearSessionAfterAuthFailure(authError, session ? 'bootstrap_refresh' : 'bootstrap_restore');
      return null;
    }

    logWarn('Session bootstrap failed without clearing session', {
      reason: authError.reason,
      error: authError,
    });

    return session;
  }
}

export async function signOut() {
  const session = await getSession();
  const refresh = await getRefreshToken();
  if (Platform.OS === 'android') {
    await nativeGoogleSignOut().catch(() => {});
  }
  if (refresh) await revokeToken(refresh).catch(() => {});
  if (session?.accessToken) await revokeToken(session.accessToken).catch(() => {});
  await clearLocalSession();
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
