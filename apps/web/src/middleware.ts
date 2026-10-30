import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Só o painel exige login. O site público (home, blog, landings) nem passa por aqui.
export default auth((req) => {
  if (!req.auth && process.env.DASHBOARD_PREVIEW !== "1") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
