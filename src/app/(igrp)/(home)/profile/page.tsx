import { UserProfile } from "@/features/users/components/user-profile";

export const dynamic = "force-dynamic";

export default function UserProfilePage() {
  return (
    <div className="container mx-auto max-w-7xl">
      <UserProfile />
    </div>
  );
}
