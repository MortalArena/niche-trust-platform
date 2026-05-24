import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'nt-locale';

/** Force English locale cookie — avoids mixed-language UI issues */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const locale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (locale !== 'en') {
    res.cookies.set(LOCALE_COOKIE, 'en', { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
