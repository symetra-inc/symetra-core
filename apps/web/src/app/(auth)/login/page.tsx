import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Playfair_Display, Inter } from "next/font/google";
import { ArrowLeft } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function LoginPage() {
  return (
    <div className={`min-h-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA] selection:bg-[#A38A5E]/30 selection:text-white ${inter.className}`}>
      
      {/* Botão Voltar */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center text-sm text-[#71717A] hover:text-[#FAFAFA] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Cabeçalho do Login */}
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

          {/* Formulário Brutalista */}
          <form className="space-y-6 mt-8">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-widest text-[#71717A]">
                E-mail Profissional
              </label>
              <input 
                id="email" 
                type="email" 
                placeholder="dr@clinica.com" 
                className="w-full h-12 px-4 bg-[#0A0A0A] border border-[#71717A]/50 rounded-sm text-[#FAFAFA] placeholder:text-[#71717A]/30 focus:outline-none focus:border-[#A38A5E] focus:ring-1 focus:ring-[#A38A5E] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-widest text-[#71717A]">
                  Senha de Acesso
                </label>
                <Link href="#" className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="w-full h-12 px-4 bg-[#0A0A0A] border border-[#71717A]/50 rounded-sm text-[#FAFAFA] placeholder:text-[#71717A]/30 focus:outline-none focus:border-[#A38A5E] focus:ring-1 focus:ring-[#A38A5E] transition-all"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FAFAFA]/90 text-sm font-medium rounded-sm mt-4">
              Autenticar
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-[#71717A]">
              Ambiente protegido. Acesso monitorado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}