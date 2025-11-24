import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
export default function Home() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <ApplicationsListHome />
    </div>
  );
}
