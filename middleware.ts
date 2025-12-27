import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isApprovedAdmin } from "@/lib/admins";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Verify user is an approved admin
    const email = token.email as string | undefined;
    if (!email) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const isAdmin = await isApprovedAdmin(email);
    if (!isAdmin) {
      // User is authenticated but not authorized - redirect to login with error
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
