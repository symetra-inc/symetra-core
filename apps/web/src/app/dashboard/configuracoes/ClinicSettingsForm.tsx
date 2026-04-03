"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { saveClinic } from "./actions";
import type { ClinicResponse } from "@/lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Persona = "ARISTOCRATA" | "SOFISTICADA" | "ESPECIALISTA";

interface CatalogItem {
  procedimento: string;
  preco: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERSONA_OPTIONS: { value: Persona; label: string; desc: string }[] = [
  { value: "ARISTOCRATA", label: "Aristocrata", desc: "Tom refinado e exclusivo" },
  { value: "SOFISTICADA", label: "Sofisticada", desc: "Elegante e acolhedora" },
  { value: "ESPECIALISTA", label: "Especialista", desc: "Técnica e objetiva" },
];

const KB_LIMIT = 3000;
const KB_WARN_AT = 0.8;

function parseCatalog(raw: unknown): CatalogItem[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw as CatalogItem[];
  return [];
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function isPhoneValid(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastState = { type: "success" | "error"; message: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium shadow-xl transition-all duration-300 ${
        toast.type === "success"
          ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
          : "bg-red-950/90 border-red-500/30 text-red-300"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── CatalogEditor ─────────────────────────────────────────────────────────────

function CatalogEditor({
  items,
  onChange,
}: {
  items: CatalogItem[];
  onChange: (items: CatalogItem[]) => void;
}) {
  const addItem = () =>
    onChange([...items, { procedimento: "", preco: 0 }]);

  const removeItem = (i: number) =>
    onChange(items.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof CatalogItem, value: string) => {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item;
      if (field === "preco") {
        const num = parseFloat(value.replace(",", "."));
        return { ...item, preco: isNaN(num) ? 0 : num };
      }
      return { ...item, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-xs text-zinc-600 py-2">
          Nenhum procedimento cadastrado. Adicione abaixo.
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nome do procedimento"
            value={item.procedimento}
            onChange={(e) => updateItem(i, "procedimento", e.target.value)}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
          />
          <div className="relative w-36 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">
              R$
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={item.preco || ""}
              onChange={(e) => updateItem(i, "preco", e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2 transition-all mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar procedimento
      </button>
    </div>
  );
}

// ── Seção de formulário ───────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
      <div className="pb-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-zinc-600">{hint}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ClinicSettingsForm({ clinic }: { clinic: ClinicResponse }) {
  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors";

  // ── Estado — Seção 1 ────────────────────────────────────────────────────────
  const [name, setName] = useState(clinic.name);
  const [doctorName, setDoctorName] = useState(clinic.doctorName);
  const [persona, setPersona] = useState<Persona>(clinic.persona);
  const [secretaryPhone, setSecretaryPhone] = useState(
    formatPhone(clinic.receptionistPhone ?? "")
  );
  const [secretaryName, setSecretaryName] = useState(clinic.receptionistName ?? "");

  // ── Estado — Seção 2 ────────────────────────────────────────────────────────
  const [knowledgeBase, setKnowledgeBase] = useState(clinic.knowledgeBase);

  // ── Estado — Seção 3 ────────────────────────────────────────────────────────
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() =>
    parseCatalog(clinic.catalog)
  );

  // ── Estado — UI ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errors, setErrors] = useState<{ name?: string; secretaryPhone?: string }>({});

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Validação ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Nome da clínica é obrigatório.";
    if (secretaryPhone && !isPhoneValid(secretaryPhone))
      next.secretaryPhone = "Telefone inválido. Use (XX) XXXXX-XXXX.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      /**
       * Fluxo de serialização do catalog:
       *   UI (CatalogItem[]) → API body (JSON via apiFetch) → NestJS (Prisma.InputJsonValue) → DB (jsonb)
       *   DB (jsonb) → NestJS select → API response (JSON) → parseCatalog() → UI (CatalogItem[])
       *
       * O array é enviado diretamente — apiFetch chama JSON.stringify() no body.
       * O NestJS armazena em campo Prisma Json sem stringify extra.
       */
      await saveClinic(clinic.id, {
        name: name.trim(),
        doctorName: doctorName.trim(),
        personaType: persona,
        secretaryPhone: secretaryPhone.replace(/\D/g, "") || undefined,
        secretaryName: secretaryName.trim() || undefined,
        knowledgeBase,
        catalog: catalogItems,
      });
      setToast({ type: "success", message: "Configurações salvas com sucesso." });
    } catch {
      setToast({ type: "error", message: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  const kbLen = knowledgeBase.length;
  const kbOver80 = kbLen > KB_LIMIT * KB_WARN_AT;
  const kbOver100 = kbLen > KB_LIMIT;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Seção 1: Dados Gerais ──────────────────────────────────────── */}
        <Section title="Dados Gerais" description="Informações básicas da clínica e da secretária.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da clínica" error={errors.name}>
              <input
                className={`${inputClass} ${errors.name ? "border-red-500/40" : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Estética Luz"
              />
            </Field>

            <Field label="Nome do médico / responsável">
              <input
                className={inputClass}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dra. Ana Lima"
              />
            </Field>
          </div>

          <Field label="Persona da IA" hint="Define o tom das respostas da Serena.">
            <div className="grid grid-cols-3 gap-3">
              {PERSONA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPersona(opt.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    persona === opt.value
                      ? "border-white/30 bg-white/[0.06] text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                  }`}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da secretária">
              <input
                className={inputClass}
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                placeholder="Ex: Juliana Costa"
              />
            </Field>

            <Field
              label="Telefone da secretária"
              hint="Recebe notificações de handoff via WhatsApp."
              error={errors.secretaryPhone}
            >
              <input
                className={`${inputClass} ${errors.secretaryPhone ? "border-red-500/40" : ""}`}
                value={secretaryPhone}
                onChange={(e) => setSecretaryPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
              />
            </Field>
          </div>
        </Section>

        {/* ── Seção 2: Base de Conhecimento ─────────────────────────────── */}
        <Section
          title="Base de Conhecimento"
          description="Texto que a Serena usa para responder dúvidas sobre a clínica."
        >
          <Field label="Conteúdo">
            <textarea
              className={`${inputClass} min-h-[180px] resize-y ${
                kbOver100 ? "border-red-500/40" : kbOver80 ? "border-amber-500/30" : ""
              }`}
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder="Descreva a clínica, procedimentos oferecidos, horários, localização, diferenciais..."
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-[11px] font-mono ${
                  kbOver100
                    ? "text-red-400"
                    : kbOver80
                      ? "text-amber-400"
                      : "text-zinc-600"
                }`}
              >
                {kbLen.toLocaleString("pt-BR")} / {KB_LIMIT.toLocaleString("pt-BR")}
                {kbOver80 && !kbOver100 && " — próximo do limite"}
                {kbOver100 && " — limite excedido"}
              </span>
            </div>
          </Field>
        </Section>

        {/* ── Seção 3: Catálogo de Procedimentos ────────────────────────── */}
        <Section
          title="Catálogo de Procedimentos"
          description="Lista de procedimentos e preços usados pela IA no atendimento."
        >
          <CatalogEditor items={catalogItems} onChange={setCatalogItems} />
        </Section>

        {/* ── Seção 4: Taxas e Comissões (read-only) ────────────────────── */}
        <Section
          title="Taxas e Comissões"
          description="Valores definidos no contrato com a Symetra. Não editável neste plano."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                Taxa de Reserva (Pix)
              </p>
              <p className="text-xl font-bold tracking-tight text-white">
                R$ {clinic.reservationFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-600">Cobrado do paciente na confirmação</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                Comissão da Agência
              </p>
              <p className="text-xl font-bold tracking-tight text-zinc-500">—</p>
              <p className="text-[11px] text-zinc-600">Gerenciado pela Symetra</p>
            </div>
          </div>
        </Section>

        {/* ── Rodapé ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>

      </form>

      <Toast toast={toast} onClose={dismissToast} />
    </>
  );
}
