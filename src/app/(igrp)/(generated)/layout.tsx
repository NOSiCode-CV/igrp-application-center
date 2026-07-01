export default function IGRPGeneratedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Trivial pass-through. The app-wide providers (e.g. IGRPQueryProvider) live in
  // the hand-owned (igrp)/layout.tsx so they cover the whole authenticated app and
  // survive a Studio regeneration of this (generated) shell.
  return <>{children}</>;
}
