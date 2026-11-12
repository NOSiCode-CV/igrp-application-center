import { HomeAppsTab } from "./home-apps/home-apps-tab";

export function EnterpriseWorkspace() {
  return (
    <div className="flex w-full flex-col mx-auto max-w-7xl">
      <div className="p-4">
        <HomeAppsTab />
      </div>
    </div>
  );
}
