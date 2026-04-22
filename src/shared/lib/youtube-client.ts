import ky from 'ky';
import {
  clearSessionAfterAuthFailure,
  getValidAccessToken,
  isTerminalSessionAuthError,
  SessionAuthError,
} from '@/features/auth/session';

const YT_BASE = 'https://www.googleapis.com/youtube/v3/';

async function ensureFreshAccessToken(forceRefresh = false): Promise<string> {
  return getValidAccessToken({
    forceRefresh,
    allowRestore: true,
  });
}

export const youtubeHooks = {
  beforeRequest: [
    async (request: Request) => {
      try {
        const token = await ensureFreshAccessToken();
        request.headers.set('Authorization', `Bearer ${token}`);
      } catch (error) {
        if (isTerminalSessionAuthError(error)) {
          await clearSessionAfterAuthFailure(error, 'before_request');
        }
        throw error;
      }
    },
  ],
  afterResponse: [
    async (request: Request, _options: unknown, response: Response, state: { retryCount: number }) => {
      if (response.status !== 401) {
        return response;
      }

      if (state.retryCount === 0) {
        try {
          const token = await ensureFreshAccessToken(true);
          const headers = new Headers(request.headers);
          headers.set('Authorization', `Bearer ${token}`);

          return ky.retry({
            request: new Request(request, { headers }),
            code: 'AUTH_REFRESHED',
          });
        } catch (error) {
          if (isTerminalSessionAuthError(error)) {
            await clearSessionAfterAuthFailure(error, '401_force_refresh');
          }

          return response;
        }
      }

      await clearSessionAfterAuthFailure(
        new SessionAuthError(
          'Unauthorized after access token refresh',
          'unauthorized_after_refresh',
          true,
        ),
        '401_after_retry',
      );

      return response;
    },
  ],
};

export const youtube = ky.create({
  prefixUrl: YT_BASE,
  hooks: youtubeHooks,
  timeout: 15_000,
  retry: { limit: 2, methods: ['get'], statusCodes: [429, 500, 502, 503, 504] },
});
