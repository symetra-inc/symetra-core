import { signOut } from "@/auth";

// /logout encerra a sessão e volta para o login.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}

export const POST = GET;
