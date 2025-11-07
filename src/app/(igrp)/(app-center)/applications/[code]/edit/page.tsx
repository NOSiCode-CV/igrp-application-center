"use client";

import { use } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ApplicationForm } from "@/features/applications/components/app-form";
import { useApplicationByCode } from "@/features/applications/use-applications";

export const dynamic = "force-dynamic";

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { data, isLoading, error } = useApplicationByCode(code);

  if (isLoading && !error)
    return <AppCenterLoading descrption="Carregando aplicação..." />;

  if (error) throw error;

  if (!data) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      />
    );
  }

  return <ApplicationForm application={data} />;
}
