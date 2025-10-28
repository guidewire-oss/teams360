import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicPath = request.nextUrl.pathname === '/' || isLoginPage;

  if (!userCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userCookie && isLoginPage) {
    const user = JSON.parse(userCookie.value);
    if (user.isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (user.hierarchyLevelId === 'level-5') {
      return NextResponse.redirect(new URL('/survey', request.url));
    } else if (user.hierarchyLevelId === 'level-4') {
      return NextResponse.redirect(new URL('/manager', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};