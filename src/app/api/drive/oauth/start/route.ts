import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Leer desde variables de entorno (NO hardcodear secretos)
const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';

export async function GET(req: NextRequest) {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REDIRECT_URI) {
    return NextResponse.json({
      ok: false,
      error: 'Faltan variables de entorno para OAuth (GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI)'
    }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2({
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    redirectUri: OAUTH_REDIRECT_URI,
  });

  const scopes = ['https://www.googleapis.com/auth/drive.file'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  return NextResponse.redirect(authUrl);
}
