import NextAuth, { type DefaultSession, type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { PREVIEW, previewSession } from "@/lib/preview";

// ── Type augmentations ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      clinicId: string | null;
      agencyId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    clinicId: string | null;
    agencyId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    clinicId: string | null;
    agencyId: string | null;
  }
}

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, password: true, clinicId: true, agencyId: true },
        });

        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clinicId: user.clinicId,
          agencyId: user.agencyId,
        };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

// Em DASHBOARD_PREVIEW=1 (só local) devolve uma sessão fictícia de clínica.
export const auth = async (): Promise<Session | null> => (PREVIEW ? previewSession : nextAuth.auth());
