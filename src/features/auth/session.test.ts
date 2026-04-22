import { Platform } from 'react-native';

import { bootstrapSession } from './session';
import { clearSession, getSession, upsertSession } from '@/db/queries/session';
import {
  deleteRefreshToken,
  getRefreshToken,
  saveRefreshToken,
} from '@/shared/lib/secure-storage';
import { nativeGoogleSignOut } from './google-native';
import { fetchUserProfile, refreshAccessToken } from './token-exchange';

jest.mock('drizzle-orm/expo-sqlite', () => ({
  useLiveQuery: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/db/client', () => ({
  db: {},
  schema: {},
}));

jest.mock('@/db/queries/session', () => ({
  clearSession: jest.fn(),
  getSession: jest.fn(),
  upsertSession: jest.fn(),
}));

jest.mock('@/shared/lib/logger', () => ({
  warn: jest.fn(),
}));

jest.mock('@/shared/lib/secure-storage', () => ({
  deleteRefreshToken: jest.fn(),
  getRefreshToken: jest.fn(),
  saveRefreshToken: jest.fn(),
}));

jest.mock('./google-native', () => ({
  nativeGoogleSignOut: jest.fn(),
  refreshNativeGoogleAccessToken: jest.fn(),
  restoreNativeGoogleSession: jest.fn(),
}));

jest.mock('./token-exchange', () => ({
  fetchUserProfile: jest.fn(),
  refreshAccessToken: jest.fn(),
  revokeToken: jest.fn(),
}));

const getSessionMock = getSession as jest.Mock;
const upsertSessionMock = upsertSession as jest.Mock;
const clearSessionMock = clearSession as jest.Mock;
const getRefreshTokenMock = getRefreshToken as jest.Mock;
const saveRefreshTokenMock = saveRefreshToken as jest.Mock;
const deleteRefreshTokenMock = deleteRefreshToken as jest.Mock;
const fetchUserProfileMock = fetchUserProfile as jest.Mock;
const refreshAccessTokenMock = refreshAccessToken as jest.Mock;
const nativeGoogleSignOutMock = nativeGoogleSignOut as jest.Mock;

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
}

function makeExpiredSession() {
  return {
    id: 1,
    googleUserId: 'google-user-1',
    email: 'user@example.com',
    name: 'User',
    avatarUrl: null,
    accessToken: 'stale-token',
    accessTokenExpiresAt: Date.now() - 60_000,
    createdAt: 123,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setPlatform('ios');
});

describe('bootstrapSession', () => {
  it('restores a missing local session from the stored refresh token', async () => {
    getSessionMock.mockResolvedValue(null);
    getRefreshTokenMock.mockResolvedValue('refresh-token');
    refreshAccessTokenMock.mockResolvedValue({
      accessToken: 'fresh-token',
      expiresAt: Date.now() + 3_600_000,
    });
    fetchUserProfileMock.mockResolvedValue({
      sub: 'google-user-1',
      email: 'user@example.com',
      name: 'User',
      picture: 'https://example.com/avatar.png',
    });

    const session = await bootstrapSession();

    expect(refreshAccessTokenMock).toHaveBeenCalledWith('refresh-token');
    expect(fetchUserProfileMock).toHaveBeenCalledWith('fresh-token');
    expect(saveRefreshTokenMock).toHaveBeenCalledWith('refresh-token');
    expect(upsertSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        googleUserId: 'google-user-1',
        email: 'user@example.com',
        accessToken: 'fresh-token',
      }),
    );
    expect(session).toEqual(
      expect.objectContaining({
        googleUserId: 'google-user-1',
        accessToken: 'fresh-token',
      }),
    );
  });

  it('keeps the current session on transient refresh failures', async () => {
    const expiredSession = makeExpiredSession();
    getSessionMock.mockResolvedValue(expiredSession);
    getRefreshTokenMock.mockResolvedValue('refresh-token');
    refreshAccessTokenMock.mockRejectedValue(new Error('network down'));

    const session = await bootstrapSession();

    expect(session).toBe(expiredSession);
    expect(clearSessionMock).not.toHaveBeenCalled();
    expect(deleteRefreshTokenMock).not.toHaveBeenCalled();
  });

  it('clears the persisted session when the refresh token was revoked', async () => {
    const expiredSession = makeExpiredSession();
    getSessionMock.mockResolvedValue(expiredSession);
    getRefreshTokenMock.mockResolvedValue('refresh-token');
    refreshAccessTokenMock.mockRejectedValue(
      new Error('Refresh failed: 400 invalid_grant — Token has been expired or revoked.'),
    );

    const session = await bootstrapSession();

    expect(session).toBeNull();
    expect(clearSessionMock).toHaveBeenCalled();
    expect(deleteRefreshTokenMock).toHaveBeenCalled();
    expect(nativeGoogleSignOutMock).not.toHaveBeenCalled();
  });
});
