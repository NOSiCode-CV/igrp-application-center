import dynamic from "next/dynamic";
import type { Metadata } from "next";

const IGRPTemplateNotFound = dynamic(
  () =>
    import("@igrp/framework-next-ui").then((mod) => mod.IGRPTemplateNotFound),
  { ssr: true },
);

export const metadata: Metadata = {
  title: "404 - Página não encontrada",
  description: "A página que você está procurando não foi encontrada.",
};

export default function NotFound() {
  const appCode = process.env.IGRP_APP_CODE || "";
  return <IGRPTemplateNotFound appCode={appCode} />;
}
