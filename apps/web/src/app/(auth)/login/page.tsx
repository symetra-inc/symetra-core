"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { authenticate } from "./actions";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col bg-zinc-950 text-white ${inter.className}`}>

      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="flex items-center text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo */}
          <div className="text-center">
            <div className="w-11 h-11 border border-zinc-800 rounded-xl flex items-center justify-center bg-zinc-900 mx-auto mb-6">
              <span className="text-white font-bold text-xl leading-none">S</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">
              Acesso Restrito
            </h2>
            <p className="text-sm text-zinc-400">
              Insira suas credenciais para acessar a infraestrutura.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                E-mail Profissional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full h-11 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-zinc-400 uppercase tracking-wider"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full h-11 px-4 pr-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              disabled={isPending}
              type="submit"
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? "Autenticando..." : "Autenticar"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
