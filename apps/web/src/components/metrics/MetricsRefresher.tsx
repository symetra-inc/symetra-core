"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dispara router.refresh() a cada 30s para atualizar métricas sem reload completo. */
export function MetricsRefresher() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
