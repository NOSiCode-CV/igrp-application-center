import { AppCatalog } from "./app-catalog";
import { RecentlyAccessed } from "./recently-accessed";
import { WelcomeBanner } from "./welcome-banner";

export function HomeAppsTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* The page needs one h1 naming what it is. It is visually redundant
          beside the catalogue heading, so it is announced but not drawn. */}
      <h1 className="sr-only">Centro de Aplicações</h1>
      <WelcomeBanner />
      <RecentlyAccessed />
      <AppCatalog />
    </div>
  );
}
