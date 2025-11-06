// import { DepartmentDetails } from "@/features/departments/components/dept-details";

export const dynamic = "force-dynamic";

export default async function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // return <DepartmentDetails code={code} />;
  return null;
}
