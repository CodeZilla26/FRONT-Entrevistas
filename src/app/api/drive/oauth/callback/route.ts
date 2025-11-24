import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Guardado simple en memoria del proceso para el refresh token en dev.
// En prod, guarda en DB o secreto seguro.
let REFRESH_TOKEN_MEMORY: string | null = null;

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/drive/oauth/callback';

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Falta code' }, { status: 400 });
  }
  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, error: 'Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2({ clientId, clientSecret, redirectUri });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      return NextResponse.json({ ok: false, error: 'No se recibió refresh_token. Usa prompt=consent y access_type=offline' }, { status: 400 });
    }

    // Guardar temporalmente
    REFRESH_TOKEN_MEMORY = tokens.refresh_token;

    // Sugerir al dev que lo pase al .env
    const suggestion = `Agrega a tu .env: GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`;

    return NextResponse.json({ ok: true, message: 'Tokens obtenidos', suggestion });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Token exchange failed' }, { status: 500 });
  }
}

// Nota: en rutas Next.js sólo se deben exportar métodos HTTP (GET, POST, etc.) y campos soportados (runtime, dynamic).
// Cualquier helper debe residir fuera de este archivo si necesita ser importado por otros módulos.
