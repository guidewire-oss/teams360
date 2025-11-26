import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicPath = request.nextUrl.pathname === '/' || isLoginPage;
  const isSurveyPage = request.nextUrl.pathname === '/survey';

  if (!userCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userCookie) {
    const user = JSON.parse(userCookie.value);
    // Map API response format: hierarchyLevel or hierarchyLevelId
    const hierarchyLevelId = user.hierarchyLevel || user.hierarchyLevelId;

    // Redirect from login page based on hierarchy level
    if (isLoginPage) {
      if (hierarchyLevelId === 'admin' || hierarchyLevelId === 'level-admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (hierarchyLevelId === 'level-1' || hierarchyLevelId === 'level-2' || hierarchyLevelId === 'level-3') {
        // VP, Director, Manager → /manager
        return NextResponse.redirect(new URL('/manager', request.url));
      } else if (hierarchyLevelId === 'level-4') {
        // Team Lead → /dashboard (their team view)
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (hierarchyLevelId === 'level-5') {
        // Team Member → /survey
        return NextResponse.redirect(new URL('/survey', request.url));
      }
    }

    // Enforce survey page access control
    if (isSurveyPage) {
      // Only level-4 (Team Lead) and level-5 (Team Member) can access survey
      if (hierarchyLevelId !== 'level-4' && hierarchyLevelId !== 'level-5') {
        // Redirect based on role
        if (hierarchyLevelId === 'admin' || hierarchyLevelId === 'level-admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          // Manager, Director, VP → /manager
          return NextResponse.redirect(new URL('/manager', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};