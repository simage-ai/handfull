import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  const publicRoutes = ["/", "/signin", "/error", "/share"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/share/")
  );

  // API routes that are public
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook");

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!req.auth?.user) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
