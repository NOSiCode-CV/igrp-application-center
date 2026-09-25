import { Geist, Geist_Mono } from "next/font/google";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Not preloaded: only the `theme-mono` theme and `font-mono` utilities use it,
// so a preload would put it on the critical path of every page for nothing.
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
});

/**
 * Deliberately a plain join, not `cn()`.
 *
 * These values are `next/font` CSS-variable class names — opaque generated
 * identifiers like `__variable_1e4310`. There is no Tailwind utility among them,
 * so there is nothing for tailwind-merge to resolve and nothing conditional for
 * clsx to drop: `cn()` would do strictly more work to produce the same string.
 *
 * This module is server code: it is reached from `igrp.template.config.ts` →
 * `app/layout.tsx` and runs at module scope. If you ever do need real class
 * merging in a server module, import `cn` from the design system's standalone
 * entry, `@igrp/igrp-framework-react-design-system/cn`, which loads nothing else
 * from the package. (On design-system versions up to 0.1.0-beta.146 the root
 * barrel was a `"use client"` boundary, and calling its `cn` here failed
 * `next build` with "Attempted to call cn() from the server but cn is on the
 * client".)
 */
export const fontVariables = [fontSans.variable, fontMono.variable].join(" ");
