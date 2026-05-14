import { getUser } from "@/actions/user";
import { UserDetailsHeader } from "@/features/users/components/user-details-header";
import { UserDetailsTabs } from "@/features/users/components/user-details-tabs";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getUser(Number(id));

  if (!result.success) notFound();

  const user = result.data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <UserDetailsHeader user={user} />
      <UserDetailsTabs user={user} />
    </div>
  );
}
