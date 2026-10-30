"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { authenticate } from "./actions";

const inputClass =
  "w-full h-11 px-4 bg-ink2 border border-[rgba(156,142,130,0.35)] rounded-xl text-linen placeholder:text-ash/60 focus:outline-none focus:border-gold transition-colors";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} required />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className={`${inputClass} pr-12`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ash hover:text-linen transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <button
        disabled={isPending}
        type="submit"
        className="w-full h-11 bg-linen text-ink hover:opacity-90 text-sm font-medium rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
