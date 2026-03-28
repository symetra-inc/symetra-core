"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Playfair_Display, Inter } from "next/font/google";
import { ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { authenticate } from "./actions";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function LoginPage() {
  // Conecta o formulário com o motor do servidor
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false); 

  return (
    <div className={`min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#A38A5E]/30 selection:text-white ${inter.className}`}>
      
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="text-center">
            <div className="w-12 h-12 border border-[#71717A] rounded-sm flex items-center justify-center bg-[#0A0A0A] mx-auto mb-6">
              <span className={`text-[#FAFAFA] font-bold text-2xl leading-none ${playfair.className}`}>S</span>
            </div>
            <h2 className={`text-3xl font-semibold tracking-tight text-[#FAFAFA] mb-2 ${playfair.className}`}>
              Acesso Restrito
            </h2>
            <p className="text-sm text-[#71717A]">
              Insira suas credenciais para acessar a infraestrutura.
            </p>
          </div>

          {/* O form action dispara a nossa Server Action */}
          <form action={formAction} className="space-y-6 mt-8">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-[#71717A]">
                E-mail Profissional
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                className="w-full h-12 px-4 bg-[#0A0A0A] border border-[#71717A]/50 rounded-sm text-[#FAFAFA] placeholder:text-[#71717A]/30 focus:outline-none focus:border-[#A38A5E] focus:ring-1 focus:ring-[#A38A5E] transition-all"
                required
              />
            </div>

<div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-[#71717A]">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} // Alterna o tipo
                  className="w-full h-12 px-4 bg-[#0A0A0A] border border-[#71717A]/50 rounded-sm text-[#FAFAFA] placeholder:text-[#71717A]/30 focus:outline-none focus:border-[#A38A5E] focus:ring-1 focus:ring-[#A38A5E] transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tratamento de Erro Elegante */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-sm border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                <p>{errorMessage}</p>
              </div>
            )}

            <Button disabled={isPending} type="submit" className="w-full h-12 bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FAFAFA]/90 text-sm font-medium rounded-sm mt-4">
              {isPending ? "Autenticando..." : "Autenticar"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}