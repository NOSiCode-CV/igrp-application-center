import { UserDetails } from "@/features/users/components/user-details";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserDetails id={id} />;
}
