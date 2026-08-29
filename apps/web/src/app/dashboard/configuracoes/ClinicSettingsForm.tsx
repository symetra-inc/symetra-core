"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { saveClinic } from "./actions";
import type { ClinicResponse } from "@/lib/api";
import type { CatalogItem } from "@/types/catalog";
import type { KnowledgeBase } from "@/types/knowledge-base";
import { KnowledgeBaseEditor } from "@/components/settings/KnowledgeBaseEditor";
import { PersonaSelector } from "@/components/settings/PersonaSelector";
import { formatCurrencyInput, parseCurrencyInput, displayCurrencyValue, formatPhone } from "@/lib/format";

type Persona = "ARISTOCRATA" | "SOFISTICADA" | "ESPECIALISTA";

const DURATION_OPTIONS: { label: string; value: number }[] = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1h",     value: 60 },
  { label: "1h30",   value: 90 },
  { label: "2h",     value: 120 },
  { label: "3h",     value: 180 },
  { label: "4h+",    value: 240 },
];

function parseCatalog(raw: unknown): CatalogItem[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  if (Array.isArray(raw)) return raw as CatalogItem[];
  return [];
}

function parseKnowledgeBase(raw: string): KnowledgeBase {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        endereco: parsed.endereco ?? "",
        horarioFuncionamento: parsed.horarioFuncionamento ?? "",
        bioMedico: parsed.bioMedico ?? "",
        diferenciaisClinica: parsed.diferenciaisClinica ?? "",
        diferenciaisProcedimentos: parsed.diferenciaisProcedimentos ?? "",
        informacoesAdicionais: parsed.informacoesAdicionais ?? "",
      };
    }
  } catch { /* plain text */ }
  return {
    endereco: "", horarioFuncionamento: "", bioMedico: "",
    diferenciaisClinica: "", diferenciaisProcedimentos: "", informacoesAdicionais: raw,
  };
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-[8px] border font-ui text-[13px] font-medium shadow-xl transition-all duration-300 ${
        toast.type === "success"
          ? "bg-ink2 border-[rgba(52,120,80,0.3)] text-[#2D6A4F]"
          : "bg-ink2 border-[rgba(180,83,9,0.25)] text-[#92400E]"
      }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />
      }
      {toast.message}
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── CatalogEditor ─────────────────────────────────────────────────────────────

function CatalogEditor({ items, onChange }: { items: CatalogItem[]; onChange: (items: CatalogItem[]) => void }) {
  const addItem = () =>
    onChange([...items, { procedimento: "", preco: 0, precoTipo: "fixo", durationMinutes: 0 }]);

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const updateItem = <K extends keyof CatalogItem>(i: number, field: K, value: CatalogItem[K]) => {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item;
      if (field === "preco") return { ...item, preco: parseCurrencyInput(String(value)) };
      return { ...item, [field]: value };
    });
    onChange(updated);
  };

  const inputClass =
    "bg-ink border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[3px] px-3 py-2 font-ui text-[13px] text-linen placeholder:text-ash/50 focus:outline-none focus:border-gold transition-colors w-full";

  const selectClass =
    "bg-ink border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[3px] px-3 py-2 font-ui text-[13px] text-linen focus:outline-none focus:border-gold transition-colors w-full appearance-none cursor-pointer";

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="font-ui text-[12px] text-ash py-2">
          Nenhum procedimento cadastrado. Adicione abaixo.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_130px_130px_36px] gap-2 items-center">
          <input
            type="text"
            placeholder="Ex: Botox, Lente Dental, Preenchimento Labial"
            value={item.procedimento}
            onChange={(e) => updateItem(i, "procedimento", e.target.value)}
            className={inputClass}
          />

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-data text-[11px] text-ash pointer-events-none">R$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={displayCurrencyValue(item.preco)}
              onChange={(e) => updateItem(i, "preco", formatCurrencyInput(e.target.value) as unknown as number)}
              className={`${inputClass} pl-8`}
            />
          </div>

          <div className="flex rounded-[3px] overflow-hidden border-[0.5px] border-[rgba(156,142,130,0.18)]">
            <button
              type="button"
              onClick={() => updateItem(i, "precoTipo", "fixo")}
              className={`flex-1 py-2 font-ui text-[11px] font-medium transition-colors ${
                item.precoTipo === "fixo"
                  ? "bg-[rgba(197,160,89,0.12)] text-gold"
                  : "text-ash hover:text-linen"
              }`}
            >
              Fixo
            </button>
            <button
              type="button"
              onClick={() => updateItem(i, "precoTipo", "a_partir")}
              className={`flex-1 py-2 font-ui text-[11px] font-medium border-l border-[rgba(156,142,130,0.18)] transition-colors ${
                item.precoTipo === "a_partir"
                  ? "bg-[rgba(197,160,89,0.12)] text-gold"
                  : "text-ash hover:text-linen"
              }`}
            >
              A partir
            </button>
          </div>

          <select
            value={item.durationMinutes || ""}
            onChange={(e) => updateItem(i, "durationMinutes", parseInt(e.target.value, 10) as unknown as number)}
            className={selectClass}
          >
            <option value="" disabled>Duração</option>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-2 rounded-[3px] text-ash hover:text-[#92400E] hover:bg-[rgba(180,83,9,0.06)] transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 font-ui text-[12px] font-medium text-ash hover:text-linen border-[0.5px] border-[rgba(156,142,130,0.18)] hover:border-[rgba(156,142,130,0.4)] rounded-[3px] px-3 py-2 transition-all mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar procedimento
      </button>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink2 border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[12px] p-6 space-y-5">
      <div className="pb-4 border-b border-[rgba(156,142,130,0.12)]">
        <h3 className="font-ui text-[13px] font-semibold text-linen">{title}</h3>
        {description && <p className="font-ui text-[11px] text-ash mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-data text-[9px] text-ash tracking-[0.15em] uppercase">{label}</label>
      {children}
      {hint && !error && <p className="font-ui text-[11px] text-ash/60">{hint}</p>}
      {error && <p className="font-ui text-[11px] text-[#92400E]">{error}</p>}
    </div>
  );
}

// ── Validação ─────────────────────────────────────────────────────────────────

function validateCatalog(items: CatalogItem[]): string | null {
  if (items.length === 0) return "Adicione ao menos um procedimento ao catálogo.";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.procedimento.trim()) return `Linha ${i + 1}: nome do procedimento obrigatório.`;
    if (!item.preco || item.preco <= 0) return `Linha ${i + 1}: preço deve ser maior que zero.`;
    if (!item.durationMinutes || item.durationMinutes <= 0)
      return `Linha ${i + 1}: selecione a duração do procedimento.`;
  }
  return null;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ClinicSettingsForm({ clinic }: { clinic: ClinicResponse }) {
  const inputClass =
    "w-full bg-ink border-[0.5px] border-[rgba(156,142,130,0.18)] rounded-[3px] px-4 py-2.5 font-ui text-[13px] text-linen placeholder:text-ash/50 focus:outline-none focus:border-gold transition-colors";

  const [name, setName] = useState(clinic.name);
  const [doctorName, setDoctorName] = useState(clinic.doctorName);
  const [persona, setPersona] = useState<Persona>(clinic.persona);
  const [secretaryPhone, setSecretaryPhone] = useState(formatPhone(clinic.receptionistPhone ?? ""));
  const [secretaryName, setSecretaryName] = useState(clinic.receptionistName ?? "");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(() => parseKnowledgeBase(clinic.knowledgeBase));
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => parseCatalog(clinic.catalog));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errors, setErrors] = useState<{ name?: string; secretaryPhone?: string; catalog?: string }>({});

  const dismissToast = useCallback(() => setToast(null), []);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Nome da clínica é obrigatório.";
    if (secretaryPhone && !isPhoneValid(secretaryPhone))
      next.secretaryPhone = "Telefone inválido. Use (XX) XXXXX-XXXX.";
    const catalogError = validateCatalog(catalogItems);
    if (catalogError) next.catalog = catalogError;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await saveClinic(clinic.id, {
        name: name.trim(),
        doctorName: doctorName.trim(),
        personaType: persona,
        secretaryPhone: secretaryPhone.replace(/\D/g, "") || undefined,
        secretaryName: secretaryName.trim() || undefined,
        knowledgeBase: JSON.stringify(knowledgeBase),
        catalog: catalogItems,
      });
      setToast({ type: "success", message: "Configurações salvas com sucesso." });
    } catch {
      setToast({ type: "error", message: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Dados Gerais */}
        <Section title="Dados Gerais" description="Identidade da clínica e da recepcionista.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da clínica" error={errors.name}>
              <input
                className={`${inputClass} ${errors.name ? "border-[rgba(180,83,9,0.4)]" : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Estética Luz"
              />
            </Field>
            <Field label="Médico / Responsável">
              <input
                className={inputClass}
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dra. Ana Lima"
              />
            </Field>
          </div>

          <Field label="Persona da Serena" hint="Define o tom das respostas no WhatsApp.">
            <PersonaSelector value={persona} onChange={setPersona} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome da recepcionista">
              <input
                className={inputClass}
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                placeholder="Ex: Juliana Costa"
              />
            </Field>
            <Field
              label="Telefone da recepcionista"
              hint="Recebe notificações de handoff via WhatsApp."
              error={errors.secretaryPhone}
            >
              <input
                className={`${inputClass} ${errors.secretaryPhone ? "border-[rgba(180,83,9,0.4)]" : ""}`}
                value={secretaryPhone}
                onChange={(e) => setSecretaryPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
              />
            </Field>
          </div>
        </Section>

        {/* Base de Conhecimento */}
        <Section
          title="Base de Conhecimento"
          description="Informações que a Serena usa para responder dúvidas sobre a clínica."
        >
          <KnowledgeBaseEditor value={knowledgeBase} onChange={setKnowledgeBase} />
        </Section>

        {/* Catálogo */}
        <Section
          title="Catálogo de Procedimentos"
          description="Procedimentos, preços e durações usados pela Serena no atendimento."
        >
          {errors.catalog && (
            <p className="font-ui text-[11px] text-[#92400E] -mt-2">{errors.catalog}</p>
          )}
          <CatalogEditor items={catalogItems} onChange={setCatalogItems} />
        </Section>

        {/* Taxas */}
        <Section title="Taxas" description="Definidas no contrato com a Symetra. Não editável.">
          <div className="space-y-0.5">
            <p className="font-data text-[9px] text-ash tracking-[0.15em] uppercase">Taxa de Reserva (Pix)</p>
            <p className="font-data font-medium text-[1.8rem] text-linen leading-none">
              R$ {clinic.reservationFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="font-ui text-[11px] text-ash mt-1">Cobrado do paciente na confirmação</p>
          </div>
        </Section>

        {/* Rodapé */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-2.5 rounded-[3px] bg-gold text-ink font-ui text-[13px] font-medium tracking-[0.03em] hover:-translate-y-px hover:shadow-[0_14px_32px_-8px_rgba(197,160,89,0.42)] disabled:opacity-50 transition-all duration-200"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={dismissToast} />
    </>
  );
}
