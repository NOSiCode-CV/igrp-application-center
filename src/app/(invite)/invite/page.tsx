import { redirect } from "next/navigation";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  redirect(
    token
      ? `/invite/accept?token=${encodeURIComponent(token)}`
      : "/invite/accept",
  );
}
