import { eq } from 'drizzle-orm';
import ky from 'ky';
import { Platform } from 'react-native';

import { db, schema } from '@/db/client';
import { refreshNativeGoogleAccessToken } from '@/features/auth/google-native';
import { getSession } from '@/db/queries/session';
import { getRefreshToken } from '@/shared/lib/secure-storage';
import { refreshAccessToken } from '@/features/auth/token-exchange';
import { signOut } from '@/features/auth/session';

const YT_BASE = 'https://www.googleapis.com/youtube/v3/';
const EXPIRY_BUFFER_MS = 60_000;

let refreshPromise: Promise<void> | null = null;

async function ensureFreshAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  if (session.accessTokenExpiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return session.accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      if (Platform.OS === 'android') {
        const next = await refreshNativeGoogleAccessToken();
        await db
          .update(schema.session)
          .set({ accessToken: next.accessToken, accessTokenExpiresAt: next.expiresAt })
          .where(eq(schema.session.id, 1));
        return;
      }

      const refresh = await getRefreshToken();
      if (!refresh) throw new Error('No refresh token');
      const next = await refreshAccessToken(refresh);
      await db
        .update(schema.session)
        .set({ accessToken: next.accessToken, accessTokenExpiresAt: next.expiresAt })
        .where(eq(schema.session.id, 1));
    })().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;

  const updated = await getSession();
  return updated!.accessToken;
}

export const youtube = ky.create({
  prefixUrl: YT_BASE,
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await ensureFreshAccessToken();
        request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          await signOut();
        }
        return response;
      },
    ],
  },
  timeout: 15_000,
  retry: { limit: 2, methods: ['get'], statusCodes: [429, 500, 502, 503, 504] },
});
