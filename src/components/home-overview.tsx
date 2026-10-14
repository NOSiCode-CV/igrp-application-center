"use client";

import { useEffect, useState } from "react";

import {
  cn,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

/** How one layer of the request handled this render. */
export type HomeLayerState = "ok" | "preview" | "error";

export interface HomeLayer {
  id: string;
  name: string;
  /** Lucide icon name, rendered through `IGRPIcon`. */
  icon: string;
  /** What this layer did for the current request, in plain words. */
  value: string;
  detail: string;
  /** Where to change it. */
  file: string;
  state: HomeLayerState;
}

export interface HomeOverviewProps {
  appName: string;
  appCode: string;
  version: string;
  previewMode: boolean;
  layers: HomeLayer[];
}

const STATE_LABEL: Record<HomeLayerState, string> = {
  ok: "Ativo",
  preview: "Pré-visualização",
  error: "Requer atenção",
};

/** Marker ring + icon colour per state. */
const STATE_MARKER: Record<HomeLayerState, string> = {
  ok: "border-primary text-primary",
  preview: "border-muted-foreground/40 text-muted-foreground",
  error: "border-destructive text-destructive",
};

/** Track segment leaving a layer. */
const STATE_TRACK: Record<HomeLayerState, string> = {
  ok: "border-solid border-primary",
  preview: "border-dashed border-muted-foreground/40",
  error: "border-dashed border-destructive",
};

/** Lets a long file path wrap after a "/" instead of mid-segment. */
function BreakablePath({ path }: { path: string }) {
  const segments = path.split("/");
  return segments.map((segment, index) => (
    // Positional segments of a fixed string: the index is the identity.
    // biome-ignore lint/suspicious/noArrayIndexKey: see above
    <span key={index}>
      {segment}
      {index < segments.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </span>
  ));
}

/** The surface every section of this page sits on. */
const PANEL =
  "flex flex-col gap-8 rounded-xl border border-border bg-card p-6 text-card-foreground sm:p-8";

/** File paths, env lines and other literal values. */
const CODE_CHIP =
  "rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground";

const HOME_SLUG_EXAMPLE = "NEXT_PUBLIC_IGRP_APP_HOME_SLUG=/dashboard";

type CopyState = "idle" | "copied" | "failed";

const COPY_LABEL: Record<CopyState, string> = {
  idle: "Copiar",
  copied: "Copiado",
  failed: "Copie manualmente",
};

const COPY_ICON: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Check",
  failed: "CircleAlert",
};

/**
 * Copies a literal value. The label confirms the copy — or, when the browser
 * refuses clipboard access, says to copy by hand — for two seconds.
 */
function CopyButton({ value }: { value: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <IGRPButton
      type="button"
      variant="outline"
      size="sm"
      iconName={COPY_ICON[state]}
      aria-live="polite"
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => setState("copied"))
          .catch(() => setState("failed"));
      }}
    >
      {COPY_LABEL[state]}
    </IGRPButton>
  );
}

/** A real sequence: each step needs the one before it. */
const NEXT_STEPS = [
  {
    title: "Escreva a funcionalidade",
    body: "Componentes, ações e lógica de cada módulo ficam juntos, fora das rotas.",
    path: "src/app/(myapp)/_features/<módulo>/",
  },
  {
    title: "Dê-lhe uma rota",
    body: "Uma página dentro de (igrp) herda a sessão, o cabeçalho e o menu lateral.",
    path: "src/app/(igrp)/<rota>/page.tsx",
  },
  {
    title: "Proteja a página",
    body: "Sem verificação, a página fica aberta a qualquer utilizador autenticado.",
    path: 'await igrpAssertAuthorize("<permissão>")',
  },
  {
    title: "Coloque-a no menu",
    body: "Em produção, o menu vem do Access Management. Em pré-visualização, do ficheiro de exemplo.",
    path: "src/temp/menus/menus.ts",
  },
] as const;

/**
 * Template home page: the live path this request took through the framework,
 * then what to build next. Every value comes from the server for THIS request,
 * so a misconfigured layer shows here instead of on a later page.
 */
export function HomeOverview({
  appName,
  appCode,
  version,
  previewMode,
  layers,
}: HomeOverviewProps) {
  const failing = layers.filter((layer) => layer.state === "error").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-5xl leading-[0.95] font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
          {appName}
        </h1>
        <p className="max-w-[60ch] text-lg text-pretty text-muted-foreground">
          {failing > 0
            ? `A aplicação está a responder, mas ${failing === 1 ? "uma camada precisa" : `${failing} camadas precisam`} de atenção. Veja abaixo o que falhou neste pedido.`
            : previewMode
              ? "A aplicação está a responder em modo de pré-visualização: sem login real e com menus de exemplo."
              : "A aplicação está a responder. Este pedido passou por todas as camadas abaixo."}
        </p>
        <ul className="flex flex-wrap items-center gap-2 text-sm">
          <li
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium",
              failing > 0
                ? "border-destructive/40 text-destructive"
                : previewMode
                  ? "border-border text-muted-foreground"
                  : "border-primary/40 text-primary",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                failing > 0
                  ? "bg-destructive"
                  : previewMode
                    ? "border-2 border-muted-foreground"
                    : "bg-primary",
              )}
            />
            {failing > 0
              ? "Requer atenção"
              : previewMode
                ? "Em pré-visualização"
                : "Operacional"}
          </li>
          <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
            Versão
            <span className="font-medium text-foreground tabular-nums">
              {version || "—"}
            </span>
          </li>
          {appCode ? (
            <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
              Código
              <span className="font-mono text-xs text-foreground">
                {appCode}
              </span>
            </li>
          ) : null}
        </ul>
      </header>

      <section aria-labelledby="home-request-path" className={PANEL}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <h2
            id="home-request-path"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            O caminho deste pedido
          </h2>
          <p
            className={cn(
              "text-sm",
              failing > 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {failing > 0
              ? `${failing} de ${layers.length} ${failing === 1 ? "camada requer" : "camadas requerem"} atenção`
              : previewMode
                ? "Modo de pré-visualização: autenticação e dados simulados"
                : `${layers.length} de ${layers.length} camadas ativas`}
          </p>
        </div>

        <ol className="grid grid-cols-1 xl:grid-cols-5">
          {layers.map((layer, index) => {
            const isLast = index === layers.length - 1;
            return (
              <li
                key={layer.id}
                className={cn(
                  "relative flex gap-4 pb-8 last:pb-0",
                  "xl:flex-col xl:gap-5 xl:pr-6 xl:pb-0 xl:last:pr-0",
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2",
                  "motion-safe:fill-mode-both motion-safe:duration-500",
                )}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                {isLast ? null : (
                  // The stretch of track this layer hands the request on
                  // through: solid when active, dashed when simulated or failing.
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-10 bottom-0 left-4.5 w-0 border-l-2",
                      "xl:top-4.5 xl:right-0 xl:bottom-auto xl:left-10 xl:h-0 xl:w-auto xl:border-t-2 xl:border-l-0",
                      STATE_TRACK[layer.state],
                    )}
                  />
                )}

                <span
                  aria-hidden="true"
                  className={cn(
                    "relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                    STATE_MARKER[layer.state],
                  )}
                >
                  <IGRPIcon iconName={layer.icon} className="size-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {layer.name}
                  </span>
                  <span
                    className={cn(
                      "text-lg leading-snug font-semibold tracking-tight text-pretty",
                      layer.state === "error"
                        ? "text-destructive"
                        : "text-foreground",
                    )}
                  >
                    {layer.value}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      layer.state === "error"
                        ? "text-destructive"
                        : layer.state === "ok"
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {STATE_LABEL[layer.state]}
                  </span>
                  <span className="mt-1 text-sm text-pretty text-muted-foreground">
                    {layer.detail}
                  </span>
                  <code
                    className={cn(
                      CODE_CHIP,
                      "mt-auto self-start xl:mt-4 xl:self-stretch",
                    )}
                  >
                    <BreakablePath path={layer.file} />
                  </code>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="home-next-steps"
          className={cn(PANEL, "lg:col-span-2")}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <h2
              id="home-next-steps"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Construir o primeiro módulo
            </h2>
            <p className="text-sm text-muted-foreground">
              {NEXT_STEPS.length} passos, da pasta ao menu
            </p>
          </div>

          <ol className="flex flex-col">
            {NEXT_STEPS.map((step, index) => {
              const isLast = index === NEXT_STEPS.length - 1;
              return (
                <li
                  key={step.title}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className="absolute top-10 bottom-0 left-4.5 w-0 border-l-2 border-dashed border-muted-foreground/40"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-sm font-semibold text-primary tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 max-w-[65ch] flex-1 flex-col gap-1 pt-1.5">
                    <span className="text-lg leading-snug font-semibold tracking-tight text-foreground">
                      <span className="sr-only">Passo {index + 1}: </span>
                      {step.title}
                    </span>
                    <span className="text-sm text-pretty text-muted-foreground">
                      {step.body}
                    </span>
                    <code className={cn(CODE_CHIP, "mt-2 self-start")}>
                      <BreakablePath path={step.path} />
                    </code>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside aria-labelledby="home-replace" className={PANEL}>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground"
            >
              <IGRPIcon iconName="House" className="size-4" />
            </span>
            <h2
              id="home-replace"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Substituir esta página
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-pretty text-muted-foreground">
              Para abrir outra página ao entrar na aplicação, defina a rota
              inicial no <span className="font-mono text-xs">.env</span> e
              reinicie o servidor.
            </p>
            <code className={cn(CODE_CHIP, "self-stretch")}>
              <BreakablePath path={HOME_SLUG_EXAMPLE} />
            </code>
            <div>
              <CopyButton value={HOME_SLUG_EXAMPLE} />
            </div>
            <p className="text-sm text-pretty text-muted-foreground">
              Esta página só aparece quando a variável está vazia.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
