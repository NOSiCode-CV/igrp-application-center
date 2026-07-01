import type { Task } from "../../types";
import { AppCatalog } from "./app-catalog";
import { RecentlyAccessed } from "./recently-accessed";
import { WelcomeBanner } from "./welcome-banner";

type Props = { tasks: Task[] };

export function HomeAppsTab({ tasks }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner tasks={tasks} />
      <RecentlyAccessed />
      <AppCatalog />
    </div>
  );
}
