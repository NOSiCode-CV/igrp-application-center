import { AppCatalog } from "./app-catalog";
import { RecentlyAccessed } from "./recently-accessed";
import { WelcomeBanner } from "./welcome-banner";

export function HomeAppsTab() {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner />
      <RecentlyAccessed />
      <AppCatalog />
    </div>
  );
}
