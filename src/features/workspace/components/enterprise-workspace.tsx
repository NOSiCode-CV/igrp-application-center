"use client";

import { useState } from "react";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";

// import { defaultTasks } from "../data/mock-tasks";
import { HomeAppsTab } from "./home-apps/home-apps-tab";

// import { TasksTab } from "./tasks/tasks-tab";

// type Tab = "home" | "tasks";

type Tab = "home";

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: IGRPTabItem[] = [
    {
      value: "home",
      label: "Home & Apps",
      content: <HomeAppsTab />,
    },
    // {
    //   value: "tasks",
    //   label: "My Tasks",
    //   content: <TasksTab tasks={defaultTasks} />,
    // },
  ];

  /**
   * The scroll chain is the whole point of this wrapper: the page gives it a
   * fixed viewport-derived height with `overflow-hidden`, so every link down to
   * the tab panel needs `flex-1` + `min-h-0` or the panel grows past the frame
   * and its `overflow-y-auto` never engages — content below the fold simply
   * gets clipped, which is what happened on short/mobile viewports.
   */
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col mx-auto max-w-7xl">
      <IGRPTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        items={tabs}
        variant="underline"
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        tabListClassName="px-4 lg:px-6"
        tabContentClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 custom-scrollbar"
      />
    </div>
  );
}
