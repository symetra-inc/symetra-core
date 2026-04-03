"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getPatientMessages } from "@/app/dashboard/chat/actions";
import type { MessageRow } from "@/app/dashboard/chat/actions";

interface Patient {
  id: string;
  name: string;
  whatsappPhone: string;
}

interface AppointmentSlim {
  id: string;
  procedureName: string;
  status: string;
  patient: Patient;
}

interface Props {
  appointment: AppointmentSlim | null;
  onClose: () => void;
}

const roleStyle: Record<
  string,
  { label: string; align: string; bubble: string }
> = {
  USER: {
    label: "Paciente",
    align: "items-start",
    bubble: "bg-white/[0.06] text-zinc-200",
  },
  AI: {
    label: "Serena IA",
    align: "items-end",
    bubble:
      "bg-emerald-500/10 text-emerald-200 border border-emerald-500/15",
  },
  HUMAN: {
    label: "Secretária",
    align: "items-end",
    bubble: "bg-blue-500/10 text-blue-200 border border-blue-500/15",
  },
};

export function AppointmentDetail({ appointment, onClose }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    setLoading(true);
    setMessages([]);
    getPatientMessages(appointment.patient.id)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [appointment?.patient.id]);

  const open = appointment !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-zinc-950 border-l border-white/[0.06] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {appointment?.patient.name}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {appointment?.procedureName}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1 font-mono">
              {appointment?.patient.whatsappPhone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center h-24 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs">Carregando histórico...</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <p className="text-center text-xs text-zinc-600 py-12">
              Nenhuma mensagem encontrada.
            </p>
          )}

          {messages.map((msg) => {
            const style = roleStyle[msg.role] ?? roleStyle.USER;
            return (
              <div key={msg.id} className={`flex flex-col ${style.align} gap-0.5`}>
                <span className="text-[10px] text-zinc-600 px-1">
                  {style.label}
                </span>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${style.bubble}`}
                >
                  {msg.content}
                </div>
                {msg.createdAt && (
                  <span className="text-[10px] text-zinc-700 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
