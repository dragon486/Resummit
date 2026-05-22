import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedin = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. If at login and already logged in, go to dashboard
  if (pathname === "/login" && isLoggedin && req.auth?.user?.id) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // 2. Protect dashboard and editor — redirect unauthenticated users to login
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/editor");
  if (isProtected && !isLoggedin) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/login"],
};
