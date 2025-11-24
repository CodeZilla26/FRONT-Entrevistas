import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '';

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      return NextResponse.json({ ok: false, error: 'Missing GOOGLE_OAUTH_* envs' }, { status: 500 });
    }

    const oauth2 = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
    });
    oauth2.setCredentials({ refresh_token: refreshToken });

    // Force token refresh
    const { credentials } = await oauth2.refreshAccessToken();
    const accessToken = credentials.access_token;
    const expiresIn = credentials.expiry_date
      ? Math.max(0, Math.floor((credentials.expiry_date - Date.now()) / 1000))
      : 3600;

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Failed to obtain access token' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, access_token: accessToken, expires_in: expiresIn });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Token error' }, { status: 500 });
  }
}
