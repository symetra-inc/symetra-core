import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { homeForRole } from "@/lib/home-route";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar | Symetra",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="theme-light min-h-screen flex flex-col bg-ink text-linen font-ui">
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        <Link href="/" className="text-sm text-ash hover:text-linen transition-colors">
          ← Voltar para o site
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="font-display font-bold text-[1.6rem] tracking-[-0.02em] leading-none mb-6">
              Syme<span className="italic font-light text-gold">tra</span>
            </p>
            <h1 className="text-xl font-semibold tracking-tight mb-1.5">
              {user ? "Você já está conectado" : "Entrar no painel"}
            </h1>
            <p className="text-sm text-ash">
              {user ? (user.email ?? user.name ?? "") : "Use o e-mail e a senha que você recebeu."}
            </p>
          </div>

          {user ? (
            <div className="space-y-3">
              <Link
                href={homeForRole(user.role)}
                className="flex items-center justify-center w-full h-11 rounded-xl bg-linen text-ink text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continuar para o painel
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl border border-[rgba(156,142,130,0.35)] text-sm text-ash hover:text-linen hover:border-[rgba(156,142,130,0.6)] transition-colors"
                >
                  Entrar com outra conta
                </button>
              </form>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </div>
  );
}
