// Permission: open to all authenticated users — demo page with no sensitive data.
import { redirect } from "next/navigation";

import { igrpGetClaims } from "@igrp/framework-next";
import { IgrpConfigError } from "@igrp/framework-next/errors";
import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";

import { type HomeLayer, HomeOverview } from "@/components/home-overview";
import { getPackageJson } from "@/lib/config/get-pkj";
import { verifySession } from "@/lib/dal";
import { isAuthBypass } from "@/lib/utilities";

export default async function Home() {
  const root = process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/";

  // Fail fast with a typed, translatable error rather than a raw `Error`
  // string. Caught by `(igrp)/error.tsx` → `IGRPSegmentError` → copy lookup
  // by `code` in `src/config/error-messages.ts`.
  if (!root.startsWith("/")) {
    throw new IgrpConfigError(
      "IGRP_APP_HOME_SLUG_INVALID",
      `NEXT_PUBLIC_IGRP_APP_HOME_SLUG must start with "/" — received "${root}".`,
      { receivedValue: root },
    );
  }

  if (root !== "/") {
    // Normally unreachable: `next.config.ts` redirects `/` to the home slug
    // before this layout renders. Kept as a fallback.
    redirect(root as Parameters<typeof redirect>[0]);
  }

  // Both are React-cached and already resolved by `(igrp)/layout.tsx` for this
  // request, so this costs no extra session read or token decode.
  const [session, claimsState] = await Promise.all([
    verifySession(),
    igrpGetClaims(),
  ]);

  const app = getPackageJson();
  const bypass = isAuthBypass();

  return (
    <HomeOverview
      appName={app.displayName || app.name || "IGRP"}
      appCode={process.env.IGRP_APP_CODE || ""}
      version={app.version ?? ""}
      previewMode={bypass}
      layers={buildLayers({
        bypass,
        userName: session.user?.name || session.user?.email || "",
        claimsState,
      })}
    />
  );
}

/**
 * The request's path through the framework, in the order it happened. Only
 * plain strings cross to the client — no token, no claim list, no internal
 * URL: this page is visible to every authenticated user.
 */
function buildLayers({
  bypass,
  userName,
  claimsState,
}: {
  bypass: boolean;
  userName: string;
  claimsState: Awaited<ReturnType<typeof igrpGetClaims>>;
}): HomeLayer[] {
  const amConfigured = Boolean(process.env.IGRP_ACCESS_MANAGEMENT_API);

  return [
    {
      id: "middleware",
      icon: "ShieldCheck",
      name: "Middleware",
      value: bypass ? "Deixa passar todos os pedidos" : "Exige sessão iniciada",
      detail: bypass
        ? "A autenticação está desligada neste ambiente."
        : "Pedidos sem sessão são enviados para o login.",
      file: "src/middleware.ts",
      state: bypass ? "preview" : "ok",
    },
    {
      id: "session",
      icon: "UserRound",
      name: "Sessão",
      value: userName || "Sessão sem nome de utilizador",
      detail: bypass
        ? "Utilizador fictício de pré-visualização."
        : `Iniciada com ${getAuthProviderIdFromEnv(process.env)}.`,
      file: "src/lib/dal.ts",
      state: bypass ? "preview" : "ok",
    },
    bypass
      ? {
          id: "access-management",
          icon: "Network",
          name: "Access Management",
          value: "Menus e aplicações de exemplo",
          detail: "Os dados vêm de src/temp, sem chamadas ao servidor.",
          file: "src/igrp.template.config.ts",
          state: "preview",
        }
      : amConfigured
        ? {
            id: "access-management",
            icon: "Network",
            name: "Access Management",
            value: "Ligado",
            detail: "Fornece os menus, as aplicações e o utilizador.",
            file: "src/igrp.template.config.ts",
            state: "ok",
          }
        : {
            id: "access-management",
            icon: "Network",
            name: "Access Management",
            value: "Sem endereço configurado",
            detail:
              "Defina IGRP_ACCESS_MANAGEMENT_API no .env para carregar os menus.",
            file: ".env",
            state: "error",
          },
    claimsState.status === "ok"
      ? {
          id: "permissions",
          icon: "KeyRound",
          name: "Permissões",
          value: claimsState.claims.isSuperAdmin
            ? "Acesso total"
            : `${claimsState.claims.permissions.length} ${claimsState.claims.permissions.length === 1 ? "permissão" : "permissões"}`,
          detail: bypass
            ? "Em pré-visualização todas as verificações passam."
            : claimsState.claims.org
              ? `Departamento ativo: ${claimsState.claims.org}.`
              : "Sem departamento ativo no token.",
          file: ".igrpstudio/permissions.json",
          state: bypass ? "preview" : "ok",
        }
      : {
          id: "permissions",
          icon: "KeyRound",
          name: "Permissões",
          value: "Não foi possível ler o token",
          detail: "Todas as verificações de permissão negam o acesso.",
          file: "src/app/(igrp)/layout.tsx",
          state: "error",
        },
    {
      id: "page",
      icon: "PanelsTopLeft",
      name: "Esta página",
      value: "Apresentada",
      detail: "Aparece quando não há uma rota inicial definida.",
      file: "src/app/(igrp)/page.tsx",
      state: "ok",
    },
  ];
}
