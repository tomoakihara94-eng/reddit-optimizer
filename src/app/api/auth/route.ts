import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.BASIC_AUTH_PASSWORD) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('matsushita_auth', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
