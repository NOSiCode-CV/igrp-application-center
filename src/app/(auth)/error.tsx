"use client";
import { useEffect } from "react";
import { IGRPSegmentError, type IGRPSegmentErrorProps } from "@igrp/framework-next-ui";
import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

const AUTH_FALLBACK = {
  title: "Não foi possível concluir a autenticação.",
  description: "Verifique a configuração do provedor de autenticação e as variáveis de ambiente. Se o problema persistir, contacte o suporte.",
};

const resolveAuthCopy: NonNullable<IGRPSegmentErrorProps["resolveCopy"]> = (error) => {
  const typed = resolveErrorCopy(error);
  if (!error || typeof error !== "object" || !("code" in (error as object))) return AUTH_FALLBACK;
  return typed;
};

export default function AuthSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, { segment: "(auth)" }); }, [error]);
  return <IGRPSegmentError error={error} reset={reset} resolveCopy={resolveAuthCopy} />;
}
