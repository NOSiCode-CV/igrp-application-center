"use client";

import { useEffect, useState } from "react";

import {
  cn,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("home.copy");
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
      {t(state)}
    </IGRPButton>
  );
}

/** A real sequence: each step needs the one before it. Text in `home.nextSteps.*`. */
const NEXT_STEPS = [
  { key: "feature", path: "src/app/(myapp)/_features/<module>/" },
  { key: "route", path: "src/app/(igrp)/<route>/page.tsx" },
  { key: "guard", path: 'await igrpAssertAuthorize("<permission>")' },
  { key: "menu", path: "src/temp/menus/menus.ts" },
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
  const t = useTranslations("home");
  const failing = layers.filter((layer) => layer.state === "error").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 lg:py-16">
      <header className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-5xl leading-[0.95] font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
          {appName}
        </h1>
        <p className="max-w-[60ch] text-lg text-pretty text-muted-foreground">
          {failing > 0
            ? t("intro.failing", { count: failing })
            : previewMode
              ? t("intro.preview")
              : t("intro.ok")}
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
              ? t("status.failing")
              : previewMode
                ? t("status.preview")
                : t("status.ok")}
          </li>
          <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
            {t("version")}
            <span className="font-medium text-foreground tabular-nums">
              {version || "—"}
            </span>
          </li>
          {appCode ? (
            <li className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-muted-foreground">
              {t("code")}
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
            {t("requestPath.title")}
          </h2>
          <p
            className={cn(
              "text-sm",
              failing > 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {failing > 0
              ? t("requestPath.failing", { failing, total: layers.length })
              : previewMode
                ? t("requestPath.preview")
                : t("requestPath.ok", { total: layers.length })}
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
                    {t(`state.${layer.state}`)}
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
              {t("nextSteps.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("nextSteps.subtitle", { count: NEXT_STEPS.length })}
            </p>
          </div>

          <ol className="flex flex-col">
            {NEXT_STEPS.map((step, index) => {
              const isLast = index === NEXT_STEPS.length - 1;
              return (
                <li
                  key={step.key}
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
                      <span className="sr-only">
                        {t("nextSteps.step", { index: index + 1 })}
                      </span>
                      {t(`nextSteps.${step.key}.title`)}
                    </span>
                    <span className="text-sm text-pretty text-muted-foreground">
                      {t(`nextSteps.${step.key}.body`)}
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
              {t("replace.title")}
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-pretty text-muted-foreground">
              {t.rich("replace.body", {
                code: (chunks) => (
                  <span className="font-mono text-xs">{chunks}</span>
                ),
              })}
            </p>
            <code className={cn(CODE_CHIP, "self-stretch")}>
              <BreakablePath path={HOME_SLUG_EXAMPLE} />
            </code>
            <div>
              <CopyButton value={HOME_SLUG_EXAMPLE} />
            </div>
            <p className="text-sm text-pretty text-muted-foreground">
              {t("replace.note")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
