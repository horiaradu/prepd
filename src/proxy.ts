import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  isValidLocale,
  getLocaleFromHeader,
} from "@/lib/i18n";

function resolveLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isValidLocale(cookie)) return cookie;
  return getLocaleFromHeader(
    request.headers.get("accept-language") ?? "",
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that never touch the session — fast path, no getToken call
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/landing") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Public landing — signed-in visitors go straight to the app
  if (pathname.startsWith("/welcome")) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const response = NextResponse.next();
    if (!request.cookies.get(LOCALE_COOKIE)) {
      response.cookies.set(LOCALE_COOKIE, resolveLocale(request), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (!token) {
    const target = pathname === "/" ? "/welcome" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Set locale cookie on first authenticated visit if not present
  const response = NextResponse.next();
  if (!request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, resolveLocale(request), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
