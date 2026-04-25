jest.mock('ky', () => ({
  __esModule: true,
  default: {
    create: jest.fn((options) => options),
    retry: jest.fn((options) => ({ retriedWith: options })),
  },
}));

jest.mock('@/features/auth/session', () => {
  class SessionAuthError extends Error {
    reason: string;
    terminal: boolean;

    constructor(message: string, reason: string, terminal: boolean) {
      super(message);
      this.reason = reason;
      this.terminal = terminal;
    }
  }

  return {
    __esModule: true,
    clearSessionAfterAuthFailure: jest.fn(),
    getValidAccessToken: jest.fn(),
    isTerminalSessionAuthError: jest.fn(),
    SessionAuthError,
  };
});

import { youtubeHooks } from './youtube-client';

const sessionModule = jest.requireMock('@/features/auth/session') as {
  clearSessionAfterAuthFailure: jest.Mock;
  getValidAccessToken: jest.Mock;
  isTerminalSessionAuthError: jest.Mock;
};

const kyModule = jest.requireMock('ky') as {
  default: {
    retry: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('youtube auth hooks', () => {
  it('retries once with a forced refresh after the first 401', async () => {
    sessionModule.getValidAccessToken.mockResolvedValue('fresh-token');

    const request = new Request('https://www.googleapis.com/youtube/v3/subscriptions');
    const response = new Response(null, { status: 401 });
    const afterResponse = youtubeHooks.afterResponse[0]!;

    await afterResponse(request, {}, response, { retryCount: 0 });

    expect(sessionModule.getValidAccessToken).toHaveBeenCalledWith({
      forceRefresh: true,
      allowRestore: true,
    });
    expect(kyModule.default.retry).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AUTH_REFRESHED',
        request: expect.any(Request),
      }),
    );

    const retryRequest = kyModule.default.retry.mock.calls[0]![0].request as Request;
    expect(retryRequest.headers.get('Authorization')).toBe('Bearer fresh-token');
    expect(sessionModule.clearSessionAfterAuthFailure).not.toHaveBeenCalled();
  });

  it('clears the session after a second 401', async () => {
    const request = new Request('https://www.googleapis.com/youtube/v3/subscriptions');
    const response = new Response(null, { status: 401 });
    const afterResponse = youtubeHooks.afterResponse[0]!;

    await afterResponse(request, {}, response, { retryCount: 1 });

    expect(sessionModule.clearSessionAfterAuthFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'unauthorized_after_refresh',
        terminal: true,
      }),
      '401_after_retry',
    );
  });

  it('clears the session when auth is terminal before the request is sent', async () => {
    const error = new Error('revoked');
    sessionModule.getValidAccessToken.mockRejectedValue(error);
    sessionModule.isTerminalSessionAuthError.mockReturnValue(true);

    const request = new Request('https://www.googleapis.com/youtube/v3/subscriptions');
    const beforeRequest = youtubeHooks.beforeRequest[0]!;

    await expect(beforeRequest(request)).rejects.toThrow('revoked');
    expect(sessionModule.clearSessionAfterAuthFailure).toHaveBeenCalledWith(
      error,
      'before_request',
    );
  });
});
