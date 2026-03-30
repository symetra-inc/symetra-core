"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  UserCheck,
  AlertTriangle,
  Sparkles,
  CheckCheck,
  RefreshCw,
  Send,
  UserCircle,
  BanknoteArrowUp,
} from "lucide-react";
import {
  type PatientRow,
  type MessageRow,
  getPatientMessages,
  toggleBotStatus,
  sendManualMessage,
} from "../actions";

// ─────────────────────────────────────────────
// TIPOS LOCAIS
// ─────────────────────────────────────────────

type DerivedStatus = "ai" | "waiting_human" | "pending_pix" | "paid";

const statusConfig: Record<
  DerivedStatus,
  { label: string; dot: string; badge: string }
> = {
  ai: {
    label: "IA Atendendo",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  waiting_human: {
    label: "Aguardando Humano",
    dot: "bg-red-400 animate-pulse",
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
  pending_pix: {
    label: "Aguard. Pix",
    dot: "bg-amber-400 animate-pulse",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  paid: {
    label: "Pago",
    dot: "bg-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function deriveStatus(patient: PatientRow): DerivedStatus {
  if (patient.requiresHuman) return "waiting_human";
  if (patient.lastAppointmentStatus === "PENDING") return "pending_pix";
  if (patient.lastAppointmentStatus === "PAID") return "paid";
  return "ai";
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Agora";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h}h`;
  return new Date(isoString).toLocaleDateString("pt-BR");
}

function formatMessageTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────

function PatientItem({
  patient,
  isActive,
  onClick,
}: {
  patient: PatientRow;
  isActive: boolean;
  onClick: () => void;
}) {
  const status = deriveStatus(patient);
  const cfg = statusConfig[status];
  const preview = patient.lastMessage
    ? patient.lastMessage.length > 48
      ? patient.lastMessage.slice(0, 48) + "…"
      : patient.lastMessage
    : "Sem mensagens ainda";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 transition-all duration-150 flex items-start gap-3 ${
        isActive
          ? "bg-white/[0.06] border-r-2 border-white/20"
          : "hover:bg-white/[0.03] border-r-2 border-transparent"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sm font-semibold text-zinc-300">
          {patient.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-medium text-white truncate">{patient.name}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">
            {formatRelativeTime(patient.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 truncate">{preview}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: MessageRow }) {
  const time = formatMessageTime(message.createdAt);

  if (message.role === "USER") {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[72%] flex flex-col gap-1 items-start">
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900 text-zinc-100 rounded-2xl rounded-bl-sm border border-white/[0.05]">
            {message.content}
          </div>
          <span className="text-[10px] text-zinc-600 px-1">{time}</span>
        </div>
      </div>
    );
  }

  if (message.role === "AI") {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[72%] flex flex-col gap-1 items-end">
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-800 text-zinc-100 rounded-2xl rounded-br-sm border border-white/[0.06]">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <Sparkles className="w-2.5 h-2.5 text-zinc-600" />
            <span className="text-[10px] text-zinc-600">Serena · {time}</span>
            <CheckCheck className="w-3 h-3 text-zinc-600" />
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "HUMAN") {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[72%] flex flex-col gap-1 items-end">
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-white/[0.08] text-zinc-100 rounded-2xl rounded-br-sm border border-white/10">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <UserCircle className="w-2.5 h-2.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-600">Humano · {time}</span>
            <CheckCheck className="w-3 h-3 text-blue-500/60" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export function ChatClient({ initialPatients }: { initialPatients: PatientRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPatients[0]?.id ?? null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Mapa de overrides otimistas para botPaused (reflete clique imediato sem esperar o server)
  const [pausedOverrides, setPausedOverrides] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Derivados ────────────────────────────────

  const selectedPatient = initialPatients.find((p) => p.id === selectedId);
  const effectiveBotPaused =
    selectedPatient
      ? (pausedOverrides[selectedPatient.id] ?? selectedPatient.botPaused)
      : false;

  const filteredPatients = initialPatients.filter(
    (p) =>
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.whatsappPhone.includes(search)
  );

  const waitingCount = initialPatients.filter((p) => p.requiresHuman).length;
  const pendingPixCount = initialPatients.filter(
    (p) => p.lastAppointmentStatus === "PENDING"
  ).length;

  // ── Efeitos ──────────────────────────────────

  // Carrega mensagens quando muda o paciente selecionado
  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    getPatientMessages(selectedId).then((msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
  }, [selectedId]);

  // Scroll automático ao final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling: revalida a lista de pacientes a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh());
    }, 10_000);
    return () => clearInterval(interval);
  }, [router]);

  // ── Handlers ─────────────────────────────────

  const handleSelectPatient = (id: string) => {
    setSelectedId(id);
    setInput("");
  };

  const handleHandoff = async () => {
    if (!selectedPatient) return;
    // Optimistic: reflete imediatamente na UI
    setPausedOverrides((prev) => ({ ...prev, [selectedPatient.id]: true }));
    inputRef.current?.focus();
    await toggleBotStatus(selectedPatient.id, true);
  };

  const handleResumeBot = async () => {
    if (!selectedPatient) return;
    setPausedOverrides((prev) => ({ ...prev, [selectedPatient.id]: false }));
    await toggleBotStatus(selectedPatient.id, false);
  };

  const handleSend = async () => {
    if (!selectedPatient || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic: adiciona mensagem localmente
    const optimisticMsg: MessageRow = {
      id: `opt-${Date.now()}`,
      role: "HUMAN",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    // Garante que o bot está pausado ao enviar como humano
    setPausedOverrides((prev) => ({ ...prev, [selectedPatient.id]: true }));

    try {
      await sendManualMessage(selectedPatient.id, text);
      // Re-fetch para substituir a mensagem otimista pela real
      const updated = await getPatientMessages(selectedPatient.id);
      setMessages(updated);
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      if (selectedId) {
        getPatientMessages(selectedId).then(setMessages);
      }
    });
  };

  // ── Render ────────────────────────────────────

  return (
    <div className="-m-8 h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* ── COLUNA ESQUERDA: Lista de pacientes ─── */}
      <div className="w-80 shrink-0 flex flex-col bg-zinc-950/60 border-r border-white/[0.06]">

        {/* Header da lista */}
        <div className="px-4 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white tracking-tight">Inbox</h2>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-all"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Resumo de status */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
          <span className="text-[10px] text-zinc-600">{filteredPatients.length} conversas</span>
          {waitingCount > 0 && (
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-md px-1.5 py-0.5">
              {waitingCount} aguardando
            </span>
          )}
          {pendingPixCount > 0 && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-1.5 py-0.5">
              {pendingPixCount} pix pendente
            </span>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {filteredPatients.length === 0 ? (
            <p className="px-4 py-8 text-xs text-zinc-600 text-center">
              Nenhum paciente encontrado.
            </p>
          ) : (
            filteredPatients.map((p) => (
              <PatientItem
                key={p.id}
                patient={p}
                isActive={p.id === selectedId}
                onClick={() => handleSelectPatient(p.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── COLUNA DIREITA: Conversa ─────────────── */}
      {selectedPatient ? (
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">

          {/* Header da conversa */}
          <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center">
                <span className="text-sm font-semibold text-zinc-300">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight leading-none mb-0.5">
                  {selectedPatient.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-2.5 h-2.5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedPatient.whatsappPhone}
                  </span>
                  {(() => {
                    const s = deriveStatus(selectedPatient);
                    const cfg = statusConfig[s];
                    return (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ml-1 ${cfg.dot}`} />
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Botão de Handoff */}
            {effectiveBotPaused ? (
              <button
                onClick={handleResumeBot}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 border border-white/[0.08] hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/[0.05] transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Devolver à IA
              </button>
            ) : selectedPatient.requiresHuman ? (
              /* Bot pausado pelo sistema, humano urgente */
              <button
                onClick={handleHandoff}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-red-950/60 text-red-400 border border-red-900/50 hover:bg-red-900/40 transition-all duration-200 animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.1)]"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Assumir Atendimento
              </button>
            ) : (
              /* IA ativa, botão discreto */
              <button
                onClick={handleHandoff}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 border border-white/[0.08] hover:border-white/20 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assumir Atendimento
              </button>
            )}
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-4 h-4 text-zinc-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-zinc-600">Nenhuma mensagem ainda.</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-zinc-950">
            <div
              className={`flex items-center gap-3 bg-white/[0.04] border rounded-2xl px-4 py-3 transition-all duration-200 ${
                effectiveBotPaused
                  ? "border-white/[0.07] focus-within:border-white/20"
                  : "border-white/[0.04] opacity-50"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={!effectiveBotPaused || sending}
                placeholder={
                  effectiveBotPaused
                    ? "Digite sua resposta..."
                    : "A IA está conduzindo. Assuma a conversa para digitar."
                }
                className="flex-1 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 outline-none disabled:cursor-not-allowed"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-zinc-600 border border-white/[0.06] rounded-lg px-2 py-1 flex items-center gap-1 cursor-default">
                  <BanknoteArrowUp className="w-3 h-3" />
                  Gerar Pix Manual
                </span>
                <button
                  onClick={handleSend}
                  disabled={!effectiveBotPaused || !input.trim() || sending}
                  className="bg-white text-zinc-950 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  Enviar
                </button>
              </div>
            </div>

            {effectiveBotPaused ? (
              <p className="text-[10px] text-zinc-600 mt-2 text-center">
                Você está no controle. A IA permanecerá silenciada até você devolvê-la.
              </p>
            ) : (
              <p className="text-[10px] text-zinc-700 mt-2 text-center">
                Ao assumir, a IA pausa automaticamente para este paciente.
              </p>
            )}
          </div>

        </div>
      ) : (
        /* Estado vazio: nenhum paciente selecionado */
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <div className="text-center space-y-2">
            <p className="text-sm text-zinc-500">Selecione uma conversa</p>
            <p className="text-xs text-zinc-700">Nenhum paciente encontrado no banco.</p>
          </div>
        </div>
      )}

    </div>
  );
}
