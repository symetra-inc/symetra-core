"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma"; 

  export async function authenticate(prevState: string | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  let targetRoute = "/dashboard"; // Rota padrão (Clínica)

  try {
    // 1. Descobrimos quem é o cara direto na fonte da verdade (Banco)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    // 2. Definimos a rota correta antes de autenticar
    if (user?.role === "AGENCY_ADMIN") {
      targetRoute = "/dashboard/agency";
    } else if (user?.role === "MASTER") {
      targetRoute = "/dashboard/agency"; // Por enquanto, Master vê a agência
    }
    // CLINIC_ADMIN e RECEPTIONIST vão para /dashboard (default)

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