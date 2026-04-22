export async function exchangeCodeForTokens(params: {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: params.clientId,
      code: params.code,
      code_verifier: params.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; error_description?: string };
    throw new Error(`Token exchange failed: ${res.status} ${body.error ?? ''} — ${body.error_description ?? ''}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token as string | undefined,
    expiresAt: Date.now() + data.expires_in * 1000,
    idToken: data.id_token,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      error_description?: string;
    };
    throw new Error(
      `Refresh failed: ${res.status} ${body.error ?? ''} — ${body.error_description ?? ''}`,
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function revokeToken(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
}

export async function fetchUserProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json() as Promise<{
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  }>;
}
