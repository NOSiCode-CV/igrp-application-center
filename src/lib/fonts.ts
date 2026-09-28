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

export const fontVariables = [fontSans.variable, fontMono.variable].join(" ");
