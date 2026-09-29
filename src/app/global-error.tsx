"use client";

// Root-segment error boundary.
//
// Next.js App Router requires a `global-error.tsx` at the root to catch
// errors thrown while rendering the root `layout.tsx` / `template.tsx` — the
// nearest `error.tsx` boundary cannot catch those because the layout they
// live under is itself the one that failed. `global-error.tsx` replaces the
// *entire* document, so we must ship our own `<html>` / `<body>`.
//
// It renders outside every provider (no next-intl context — the failing root
// layout is what mounts it), so the language comes from the IGRP_LOCALE
// cookie and the copy from the minimal inline table below.
//
// This file renders `IGRPGlobalError` (the full-page error component) and
// hands logging off to `reportError`, which in prod is the single hook to
// wire a real observability backend into.

import { useEffect, useSyncExternalStore } from "react";

import { IGRPGlobalError } from "@igrp/framework-next-ui";

import { getPublicErrorMessage } from "@/components/errors/use-error-copy";
import {
  LOCALE_COOKIE,
  type Locale,
  normalizeLocale,
  PLATFORM_DEFAULT_LOCALE,
} from "@/i18n/config";
import { reportError } from "@/lib/report-error";

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    reset: string;
    retrying: string;
    errorRef: string;
  }
> = {
  pt: {
    title: "Ocorreu um erro inesperado.",
    description:
      "Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.",
    reset: "Tentar novamente",
    retrying: "A tentar...",
    errorRef: "ID de referência:",
  },
  en: {
    title: "An unexpected error occurred.",
    description:
      "Please try again. If the problem persists, contact the support team and quote the reference ID shown below.",
    reset: "Try again",
    retrying: "Retrying...",
    errorRef: "Reference ID:",
  },
  fr: {
    title: "Une erreur inattendue s'est produite.",
    description:
      "Veuillez réessayer. Si le problème persiste, contactez l'équipe d'assistance en indiquant l'identifiant de référence ci-dessous.",
    reset: "Réessayer",
    retrying: "Nouvelle tentative...",
    errorRef: "Identifiant de référence :",
  },
};

type Copy = { title: string; description: string };

/**
 * Framework config errors are the typical reason the root layout fails, so
 * their diagnosis is kept here too (same codes as `errors.codes.*`).
 */
const CODE_COPY: Record<Locale, Record<string, Copy>> = {
  pt: {
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
  },
  en: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: "IGRP configuration not initialized",
      description:
        "The application configuration file was not loaded. Contact the technical team to check the server startup.",
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: "Access management not configured",
      description:
        "The access management API URL is not set. Set the application environment variable or enable preview mode to continue.",
    },
    IGRP_APP_CODE_MISSING: {
      title: "Application code missing",
      description:
        "The application did not declare its identifier code. Check the IGRP configuration file.",
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: "Invalid application home URL",
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG does not start with "/". Fix the environment variable and restart the server.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: "Invalid authentication configuration",
      description:
        "One or more environment variables required by the authentication provider are missing or incorrect.",
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: "Failed to load layout data",
      description:
        "The menus or user data could not be loaded. Try again; if it persists, contact support.",
    },
  },
  fr: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: "Configuration IGRP non initialisée",
      description:
        "Le fichier de configuration de l'application n'a pas été chargé. Contactez l'équipe technique pour vérifier le démarrage du serveur.",
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: "Gestion des accès non configurée",
      description:
        "L'URL de l'API de gestion des accès n'est pas définie. Définissez la variable d'environnement de l'application ou activez le mode aperçu pour continuer.",
    },
    IGRP_APP_CODE_MISSING: {
      title: "Code de l'application manquant",
      description:
        "L'application n'a pas déclaré son code d'identification. Vérifiez le fichier de configuration IGRP.",
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: "URL d'accueil de l'application invalide",
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG ne commence pas par "/". Corrigez la variable d\'environnement et redémarrez le serveur.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: "Configuration d'authentification invalide",
      description:
        "Une ou plusieurs variables d'environnement requises par le fournisseur d'authentification sont manquantes ou incorrectes.",
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: "Échec du chargement des données de mise en page",
      description:
        "Impossible de charger les menus ou les données de l'utilisateur. Réessayez ; si le problème persiste, contactez l'assistance.",
    },
  },
};

function readCookieLocale(): Locale {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
  return (
    normalizeLocale(match?.slice(LOCALE_COOKIE.length + 1)) ??
    PLATFORM_DEFAULT_LOCALE
  );
}

const noopSubscribe = () => () => {};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(
    noopSubscribe,
    readCookieLocale,
    () => PLATFORM_DEFAULT_LOCALE,
  );
  const copy = COPY[locale];

  useEffect(() => {
    reportError(error, { segment: "global" });
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <IGRPGlobalError
          error={error}
          reset={reset}
          resolveCopy={(err) => {
            const code = (err as { code?: unknown }).code;
            const byCode =
              typeof code === "string" ? CODE_COPY[locale][code] : undefined;
            return (
              byCode ?? {
                title: copy.title,
                description: getPublicErrorMessage(err) ?? copy.description,
              }
            );
          }}
          resetLabel={copy.reset}
          retryingLabel={copy.retrying}
          errorRefLabel={copy.errorRef}
        />
      </body>
    </html>
  );
}
