"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  UserCheck,
  Sparkles,
  CheckCheck,
  RefreshCw,
  UserCircle,
  BotOff,
  Timer,
  ChevronLeft,
  Clock,
  X,
  Send,
} from "lucide-react";
import {
  type PatientRow,
  type MessageRow,
  getPatientMessages,
  performHandoff,
  sendManualMessage,
} from "../actions";

// ─────────────────────────────────────────────
// TIPOS E CONFIGURAÇÃO DE STATUS
// ─────────────────────────────────────────────

type DerivedStatus = "serena_ativa" | "ia_silenciada" | "aguardando";

const statusDot: Record<DerivedStatus, string> = {
  serena_ativa: "bg-emerald-400",
  ia_silenciada: "bg-red-400",
  aguardando: "bg-amber-400 animate-pulse",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function deriveStatus(patient: PatientRow): DerivedStatus {
  if (patient.botPaused || patient.lastAppointmentIsAiMuted) return "ia_silenciada";
  if (patient.requiresHuman || patient.lastAppointmentStatus === "PENDING") return "aguardando";
  return "serena_ativa";
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

function formatClockTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────

function AiStatusBadge({ isAiMuted }: { isAiMuted: boolean }) {
  if (isAiMuted) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
        <BotOff className="w-2.5 h-2.5" />
        Serena pausada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <Sparkles className="w-2.5 h-2.5" />
      Serena ativa
    </span>
  );
}

function SlaTimer({
  createdAt,
  handoffTime,
  isAiMuted,
}: {
  createdAt: string;
  handoffTime: string | null;
  isAiMuted: boolean;
}) {
  const frozenElapsed = handoffTime
    ? new Date(handoffTime).getTime() - new Date(createdAt).getTime()
    : null;

  const [elapsed, setElapsed] = useState(() =>
    frozenElapsed ?? (Date.now() - new Date(createdAt).getTime())
  );

  // Atualiza elapsed quando handoffTime chega (passagem de ativo → congelado)
  useEffect(() => {
    if (frozenElapsed !== null) {
      setElapsed(frozenElapsed);
    }
  }, [frozenElapsed]);

  // Não incrementa quando congelado (handoff já ocorreu ou IA silenciada)
  useEffect(() => {
    if (handoffTime || isAiMuted) return;
    const id = setInterval(
      () => setElapsed(Date.now() - new Date(createdAt).getTime()),
      60_000
    );
    return () => clearInterval(id);
  }, [createdAt, handoffTime, isAiMuted]);

  const isFrozen = !!(handoffTime || isAiMuted);
  const totalMin = Math.floor(elapsed / 60_000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  const label = h > 0 ? `${h}h ${min}min` : `${totalMin}min`;

  if (isFrozen) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border bg-zinc-800/50 border-zinc-700/50 text-zinc-500">
        <CheckCheck className="w-2.5 h-2.5" />
        {label}
      </span>
    );
  }

  const isPulsing = totalMin >= 8;
  const colorClass =
    totalMin < 8 ? "text-emerald-400" : totalMin < 15 ? "text-amber-400" : "text-red-400";
  const bgClass =
    totalMin < 8
      ? "bg-emerald-500/10 border-emerald-500/20"
      : totalMin < 15
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-red-500/10 border-red-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md border ${bgClass} ${colorClass} ${isPulsing ? "animate-pulse" : ""}`}
    >
      <Timer className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

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
  const dot = statusDot[status];
  const preview = patient.lastMessage
    ? patient.lastMessage.length > 60
      ? patient.lastMessage.slice(0, 60) + "…"
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
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-sm font-semibold text-zinc-300">
          {patient.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-medium text-white truncate">{patient.name}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">
            {formatRelativeTime(patient.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 truncate">{preview}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
          {/* Badge apenas quando IA silenciada (isAiMuted=true) */}
          {status === "ia_silenciada" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-2.5 h-2.5" />
              Em atendimento
            </span>
          )}
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
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900 text-zinc-100 rounded-2xl rounded-bl-sm border border-white/[0.05] cursor-default">
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
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-800 text-zinc-100 rounded-2xl rounded-br-sm border border-white/[0.06] cursor-default">
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
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-white/[0.08] text-zinc-100 rounded-2xl rounded-br-sm border border-white/10 cursor-default">
            {message.content}
          </div>
          <div className="flex items-center gap-1.5 px-1">
            <UserCircle className="w-2.5 h-2.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-600">Recepcionista · {time}</span>
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

export function ChatClient({
  initialPatients,
  initialPatientId = null,
}: {
  initialPatients: PatientRow[];
  initialPatientId?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPatientId ?? initialPatients[0]?.id ?? null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Mobile: controla qual painel está visível (lista ou conversa)
  const [showConversationOnMobile, setShowConversationOnMobile] = useState(
    !!(initialPatientId ?? initialPatients[0]?.id)
  );

  // Overrides otimistas para handoff { isAiMuted, handoffTime }
  const [handoffOverrides, setHandoffOverrides] = useState<
    Record<string, { isAiMuted: boolean; handoffTime: string }>
  >({});
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Derivados ────────────────────────────────

  const selectedPatient = initialPatients.find((p) => p.id === selectedId);
  const override = selectedPatient ? handoffOverrides[selectedPatient.id] : undefined;
  const effectiveIsAiMuted =
    override?.isAiMuted ?? selectedPatient?.lastAppointmentIsAiMuted ?? false;
  const effectiveHandoffTime =
    override?.handoffTime ?? selectedPatient?.lastAppointmentHandoffTime ?? null;

  const filteredPatients = initialPatients.filter(
    (p) =>
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.whatsappPhone.includes(search)
  );

  // ── Efeitos ──────────────────────────────────

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    getPatientMessages(selectedId).then((msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
  }, [selectedId]);

  // Scroll suave até a mensagem mais recente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling de 10s
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => router.refresh());
      // Atualiza mensagens do paciente selecionado via polling
      if (selectedId) {
        getPatientMessages(selectedId).then(setMessages);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [router, selectedId]);

  // Auto-clear de erros após 4s
  useEffect(() => {
    if (!handoffError) return;
    const id = setTimeout(() => setHandoffError(null), 4_000);
    return () => clearTimeout(id);
  }, [handoffError]);

  // ── Handlers ─────────────────────────────────

  const handleSelectPatient = (id: string) => {
    setSelectedId(id);
    setShowConversationOnMobile(true);
  };

  const handleBackToList = () => {
    setShowConversationOnMobile(false);
  };

  const handleHandoff = async () => {
    if (!selectedPatient?.lastAppointmentId || effectiveIsAiMuted || handoffLoading) return;

    const patientId = selectedPatient.id;
    const appointmentId = selectedPatient.lastAppointmentId;
    const now = new Date().toISOString();

    // Optimistic update: congela timer + muda botão imediatamente
    setHandoffOverrides((prev) => ({
      ...prev,
      [patientId]: { isAiMuted: true, handoffTime: now },
    }));
    setHandoffLoading(true);

    try {
      await performHandoff(appointmentId);
    } catch {
      // Reverteu
      setHandoffOverrides((prev) => {
        const next = { ...prev };
        delete next[patientId];
        return next;
      });
      setHandoffError("Falha ao assumir atendimento. Tente novamente.");
    } finally {
      setHandoffLoading(false);
    }
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || !selectedId || sendingMessage) return;

    setSendingMessage(true);
    setInputValue("");

    // Optimistic: adiciona a mensagem na tela imediatamente
    const optimisticMsg: MessageRow = {
      id: `optimistic-${Date.now()}`,
      role: "HUMAN",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const saved = await sendManualMessage(selectedId, content);
      // Substitui o optimistic pelo salvo
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? saved : m))
      );
    } catch {
      // Reverte o optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputValue(content);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
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

      {/* ── PAINEL ESQUERDO: Lista de pacientes ──── */}
      <div
        className={`
          flex-col bg-zinc-950/60 border-r border-white/[0.06]
          w-full md:w-80 md:shrink-0
          ${showConversationOnMobile ? "hidden md:flex" : "flex"}
        `}
      >
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

        <div className="px-4 py-2 border-b border-white/[0.04]">
          <span className="text-[10px] text-zinc-600">
            {filteredPatients.length} {filteredPatients.length === 1 ? "conversa" : "conversas"}
          </span>
        </div>

        {/* Lista de pacientes */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {filteredPatients.length === 0 ? (
            <p className="px-4 py-8 text-xs text-zinc-600 text-center">
              Nenhum paciente encontrado.
            </p>
          ) : (
            filteredPatients.map((p) => {
              const ov = handoffOverrides[p.id];
              const effectivePatient = ov
                ? { ...p, lastAppointmentIsAiMuted: ov.isAiMuted, lastAppointmentHandoffTime: ov.handoffTime }
                : p;
              return (
                <PatientItem
                  key={p.id}
                  patient={effectivePatient}
                  isActive={p.id === selectedId}
                  onClick={() => handleSelectPatient(p.id)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── PAINEL DIREITO: Conversa ──────────────── */}
      <div
        className={`
          flex-1 flex-col bg-zinc-950 overflow-hidden
          ${showConversationOnMobile ? "flex" : "hidden md:flex"}
        `}
      >
        {selectedPatient ? (
          <>
            {/* Header da conversa */}
            <div className="h-auto shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botão voltar — só aparece em mobile */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all shrink-0"
                  aria-label="Voltar para lista"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-zinc-300">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Nome + telefone + badges */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white tracking-tight leading-none mb-1 truncate">
                    {selectedPatient.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {selectedPatient.whatsappPhone}
                      </span>
                    </div>
                    <AiStatusBadge isAiMuted={effectiveIsAiMuted} />
                    {selectedPatient.lastAppointmentCreatedAt && (
                      <SlaTimer
                        createdAt={selectedPatient.lastAppointmentCreatedAt}
                        handoffTime={effectiveHandoffTime}
                        isAiMuted={effectiveIsAiMuted}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Botão "Assumir atendimento" — única ação POST desta tela */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <button
                  onClick={handleHandoff}
                  disabled={effectiveIsAiMuted || !selectedPatient.lastAppointmentId || handoffLoading}
                  className={
                    effectiveIsAiMuted
                      ? "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 border border-white/[0.05] cursor-default select-none"
                      : "flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600/90 text-white border border-indigo-500/50 hover:bg-indigo-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  }
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {effectiveIsAiMuted ? "Em atendimento" : "Assumir atendimento"}
                  </span>
                </button>
                {/* Erro inline — auto-oculta após 4s */}
                {handoffError && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
                    <span>{handoffError}</span>
                    <button onClick={() => setHandoffError(null)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Área de mensagens — read-only */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 cursor-default">
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

            {/* Área de input / faixa informativa */}
            <div className="shrink-0 px-4 md:px-6 py-3 border-t border-white/[0.04] bg-zinc-950/50">
              {effectiveIsAiMuted ? (
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 resize-none bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-white/20 transition-colors max-h-32 overflow-y-auto"
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sendingMessage}
                    className="p-2 rounded-xl bg-indigo-600/90 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    title="Enviar mensagem"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-600 text-center">
                  A Serena está gerenciando esta conversa
                </p>
              )}
            </div>
          </>
        ) : (
          /* Estado vazio */
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 gap-3">
            <button
              onClick={handleBackToList}
              className="md:hidden absolute top-4 left-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
              aria-label="Voltar para lista"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-sm text-zinc-500">Selecione uma conversa</p>
            <p className="text-xs text-zinc-700">Escolha um paciente na lista para ver as mensagens.</p>
          </div>
        )}
      </div>

    </div>
  );
}
