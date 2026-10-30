"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { homeForRole } from "@/lib/home-route";

  export async function authenticate(prevState: string | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  let targetRoute = "/dashboard";

  try {
    // 1. Descobrimos quem é o cara direto na fonte da verdade (Banco)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    // 2. Definimos a rota correta antes de autenticar
    targetRoute = homeForRole(user?.role);

    // 3. Autenticamos e forçamos o NextAuth a fazer o redirecionamento interno
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: targetRoute, 
    });

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciais inválidas. Tente novamente.";
        default:
          return "Ocorreu um erro na autenticação.";
      }
    }
    throw error;
  }
}