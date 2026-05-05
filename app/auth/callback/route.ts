import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Hard server-side redirect to the homepage, preserving the code in the URL.
  // The browser Supabase client (detectSessionInUrl: true) will auto-exchange
  // the code using the PKCE verifier it stored in localStorage during sign-in.
  const target = new URL('/', origin);
  target.searchParams.set('welcome', '1');
  target.searchParams.set('code', code);
  return NextResponse.redirect(target);
}
