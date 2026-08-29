"use client";

import type { KnowledgeBase } from "@/types/knowledge-base";

// ── Helpers ───────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof KnowledgeBase)[] = [
  "endereco",
  "horarioFuncionamento",
  "bioMedico",
  "diferenciaisClinica",
  "diferenciaisProcedimentos",
];

function countFilled(kb: KnowledgeBase): number {
  return REQUIRED_FIELDS.filter((f) => kb[f].trim().length > 0).length;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KnowledgeBaseEditor({
  value,
  onChange,
}: {
  value: KnowledgeBase;
  onChange: (next: KnowledgeBase) => void;
}) {
  const filled = countFilled(value);
  const total = REQUIRED_FIELDS.length;

  const progressColor =
    filled <= 2
      ? "bg-red-500"
      : filled <= 4
        ? "bg-amber-500"
        : "bg-emerald-500";

  const progressTextColor =
    filled <= 2
      ? "text-red-400"
      : filled <= 4
        ? "text-amber-400"
        : "text-emerald-400";

  const set = (field: keyof KnowledgeBase) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...value, [field]: e.target.value });

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors";

  const textareaClass = (rows: number) =>
    `${inputClass} resize-y`;

  return (
    <div className="space-y-5">
      {/* Indicador de completude */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Completude da base de conhecimento</span>
          <span className={`text-xs font-medium ${progressTextColor}`}>
            {filled}/{total} campos preenchidos
            {filled < total && " — complete todos para melhores resultados da Serena"}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${(filled / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Campo 1 — Endereço */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Endereço da clínica <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          value={value.endereco}
          onChange={set("endereco")}
          placeholder="Ex: Rua das Flores, 123, Sala 45 — Jardins, São Paulo/SP — CEP 01234-567"
        />
      </div>

      {/* Campo 2 — Horário de funcionamento */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Horário de funcionamento <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={2}
          className={textareaClass(2)}
          value={value.horarioFuncionamento}
          onChange={set("horarioFuncionamento")}
          placeholder="Ex: Segunda a sexta das 9h às 18h, sábados das 9h às 13h. Atendimento com hora marcada."
        />
      </div>

      {/* Campo 3 — Sobre o médico */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Sobre o Dr(a). responsável <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          className={textareaClass(4)}
          value={value.bioMedico}
          onChange={set("bioMedico")}
          placeholder="Ex: Dra. Ana Lima, dermatologista com 12 anos de experiência, especialização em estética avançada pela USP. Conhecida pela abordagem natural e resultados discretos. Atende pessoalmente todas as consultas."
        />
        <p className="text-[11px] text-zinc-600">
          Inclua: tempo de carreira, especializações, estilo de atendimento e diferenciais pessoais.
        </p>
      </div>

      {/* Campo 4 — Diferenciais da clínica */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Diferenciais da clínica <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          className={textareaClass(4)}
          value={value.diferenciaisClinica}
          onChange={set("diferenciaisClinica")}
          placeholder="Ex: Equipamentos de última geração (laser Fotona importado), ambiente exclusivo com apenas 3 salas de atendimento, localização privilegiada com estacionamento próprio, parcelamento em até 12x sem juros."
        />
        <p className="text-[11px] text-zinc-600">
          Inclua: equipamentos, estrutura, localização, condições de pagamento, certificações.
        </p>
      </div>

      {/* Campo 5 — Características dos procedimentos */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Características dos procedimentos <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={4}
          className={textareaClass(4)}
          value={value.diferenciaisProcedimentos}
          onChange={set("diferenciaisProcedimentos")}
          placeholder="Ex: Botox com técnica de micropontos — menos dor e hematomas. Resultado natural, sem expressão congelada. Pós-procedimento: leve vermelhidão por 2-4h, sem afastamento necessário."
        />
        <p className="text-[11px] text-zinc-600">
          Inclua: técnicas usadas, nível de invasividade, tempo de recuperação, cuidados pós-procedimento.
        </p>
      </div>

      {/* Campo 6 — Informações adicionais (opcional) */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Informações adicionais{" "}
          <span className="text-zinc-600 normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          rows={3}
          className={textareaClass(3)}
          value={value.informacoesAdicionais}
          onChange={set("informacoesAdicionais")}
          placeholder="Qualquer outra informação relevante sobre a clínica que a Serena deva saber para atender melhor os pacientes."
        />
        <p className="text-[11px] text-zinc-600">
          Campo livre para informações específicas da sua clínica que não se encaixam nas categorias acima.
        </p>
      </div>
    </div>
  );
}
