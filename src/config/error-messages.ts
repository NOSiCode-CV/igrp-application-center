// ─────────────────────────────────────────────────────────────────────────────
// User-facing error copy, keyed by framework `IgrpError.code`.
//
// The framework throws typed errors carrying stable machine codes. This file
// maps those codes to Portuguese copy for the UI. Later, swap the const
// objects out for a real i18n library without changing call sites.
// ─────────────────────────────────────────────────────────────────────────────

import { parsePublicDigest } from "@/lib/errors";

export type ErrorCopy = {
  title: string;
  description: string;
};

const COPY_BY_CODE: Record<string, ErrorCopy> = {
  IGRP_CONFIG_NOT_INITIALIZED: {
    title: "Configuração do IGRP não inicializada",
    description:
      "O ficheiro de configuração da aplicação não foi carregado. Contacte a equipa técnica para verificar o arranque do servidor.",
  },
  IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
    title: "Gestão de acesso não configurada",
    description:
      "A URL da API de gestão de acesso não está definida. Defina a variável de ambiente da aplicação ou active o modo de pré-visualização para continuar.",
  },
  IGRP_APP_CODE_MISSING: {
    title: "Código da aplicação em falta",
    description:
      "A aplicação não declarou o seu código identificador. Verifique o ficheiro de configuração do IGRP.",
  },
  IGRP_APP_HOME_SLUG_INVALID: {
    title: "URL inicial da aplicação inválida",
    description:
      'O valor de NEXT_PUBLIC_IGRP_APP_HOME_SLUG não começa por "/". Corrija a variável de ambiente e reinicie o servidor.',
  },
  IGRP_AUTH_CONFIG_INVALID: {
    title: "Configuração de autenticação inválida",
    description:
      "Uma ou mais variáveis de ambiente necessárias ao provedor de autenticação estão em falta ou incorrectas.",
  },
  IGRP_LAYOUT_DATA_FAILED: {
    title: "Falha ao carregar os dados de layout",
    description:
      "Não foi possível carregar os menus ou dados do utilizador. Tente novamente; se persistir, contacte o suporte.",
  },
};

const FALLBACK_COPY: ErrorCopy = {
  title: "Ocorreu um erro inesperado.",
  description:
    "Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.",
};

/**
 * Resolves a `{ title, description }` pair for an error. Preference order:
 *
 *   1. If the error carries a known `code` (framework `IgrpError` subclasses),
 *      return the mapped Portuguese copy from `COPY_BY_CODE`.
 *   2. If the error was thrown as an `AppError`, the public message is encoded
 *      in `error.digest` — extract and use it as the description.
 *   3. Fall back to a generic message.
 *
 * Works in both dev (where the error is the real instance) and production
 * (where Next may have serialized the error across the server→client edge —
 * `code`, `name`, and `digest` all survive that transport).
 */
export function resolveErrorCopy(error: unknown): ErrorCopy {
  if (!error || typeof error !== "object") return FALLBACK_COPY;
  const maybe = error as { code?: unknown; digest?: string };

  // 1. Framework typed error (IgrpError subclass) → look up by stable code.
  const code = typeof maybe.code === "string" ? maybe.code : undefined;
  if (code && code in COPY_BY_CODE) return COPY_BY_CODE[code];

  // 2. AppError → user message is encoded in digest as "errorId|message".
  const { message } = parsePublicDigest(maybe.digest);
  if (message) {
    return { title: FALLBACK_COPY.title, description: message };
  }

  return FALLBACK_COPY;
}
