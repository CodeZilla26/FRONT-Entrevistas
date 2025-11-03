import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Deprecated endpoint. Upload directly to Google Drive from client.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'Deprecated endpoint. Upload directly to Google Drive from client.' },
    { status: 410 }
  );
}
