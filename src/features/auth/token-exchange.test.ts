import { refreshAccessToken } from './token-exchange';

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client-id';
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('refreshAccessToken', () => {
  it('omits empty error details from refresh failures', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(refreshAccessToken('refresh-token')).rejects.toThrow('Refresh failed: 500');
  });

  it('includes available Google error details in refresh failures', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: 'invalid_grant',
        error_description: 'Token has been expired or revoked.',
      }),
    });

    await expect(refreshAccessToken('refresh-token')).rejects.toThrow(
      'Refresh failed: 400 invalid_grant - Token has been expired or revoked.',
    );
  });
});
