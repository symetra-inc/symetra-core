import type { NextAuthConfig } from "next-auth";
import { SignJWT, jwtVerify } from "jose";
import type { JWT } from "next-auth/jwt";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    async encode({ token, maxAge }) {
      const key = getSecretKey();
      const payload = token as Record<string, unknown>;
      return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + (maxAge ?? 30 * 24 * 60 * 60))
        .sign(key);
    },
    async decode({ token }) {
      if (!token) return null;
      const key = getSecretKey();
      const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
      return payload as JWT;
    },
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role;
        token.clinicId = (user as any).clinicId;
        token.agencyId = (user as any).agencyId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.clinicId = token.clinicId;
      session.user.agencyId = token.agencyId;
      return session;
    },
  },
};
