"use client";

export type PersonaType = "ARISTOCRATA" | "SOFISTICADA" | "ESPECIALISTA";

interface PersonaOption {
  value: PersonaType;
  label: string;
  description: string;
  recommended?: boolean;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    value: "SOFISTICADA",
    label: "Sofisticada",
    description:
      "Tom refinado e elegante. Respostas objetivas com vocabulário cuidadoso e calor humano. Indicada para clínicas premium, procedimentos de alto valor e públicos exigentes.",
    recommended: true,
  },
  {
    value: "ARISTOCRATA",
    label: "Aristocrata",
    description:
      "Tom aristocrático e exclusivo. Vocabulário formal, frases precisas e distanciamento elegante. Indicada para clínicas de ultra-alto padrão cujo público valoriza distinção acima de tudo.",
  },
  {
    value: "ESPECIALISTA",
    label: "Especialista",
    description:
      "Tom técnico, direto e autoritário. Foco em protocolos, segurança e resultados clínicos. Indicada para clínicas com abordagem científica e pacientes que valorizam expertise.",
  },
];

interface PersonaSelectorProps {
  value: PersonaType;
  onChange: (value: PersonaType) => void;
}

export function PersonaSelector({ value, onChange }: PersonaSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {PERSONA_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex flex-col items-start text-left p-4 rounded-xl border transition-all ${
              selected
                ? "border-white/30 bg-white/[0.07] text-white"
                : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15] hover:text-zinc-300"
            }`}
          >
            {/* Badge */}
            {opt.recommended && (
              <span className="absolute top-3 right-3 text-[10px] font-medium tracking-wide text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded-full px-2 py-0.5 leading-none">
                Recomendada
              </span>
            )}

            {/* Nome */}
            <span className="text-xs font-semibold mb-2 pr-20">
              {opt.label}
            </span>

            {/* Descrição */}
            <span className="text-[11px] leading-relaxed opacity-70">
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
