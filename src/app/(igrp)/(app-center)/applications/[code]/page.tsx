import { ApplicationDetails } from "@/features/applications/components/app-details";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ApplicationDetails code={code} />;
}
