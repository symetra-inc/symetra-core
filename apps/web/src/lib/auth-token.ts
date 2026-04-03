import { auth } from "@/auth";
import { SignJWT } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

export async function getAuthToken() {
  const session = await auth();

  if (!session?.user) return null;

  const key = getSecretKey();

  const token = await new SignJWT({
    id: session.user.id,
    role: session.user.role,
    clinicId: session.user.clinicId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  return token;
}
