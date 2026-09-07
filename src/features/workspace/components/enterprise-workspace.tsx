"use client";

import { useState } from "react";

import {
  type IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";

import { defaultTasks } from "../data/mock-tasks";
import { HomeAppsTab } from "./home-apps/home-apps-tab";
import { TasksTab } from "./tasks/tasks-tab";

type Tab = "home" | "tasks";

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: IGRPTabItem[] = [
    {
      value: "home",
      label: "Home & Apps",
      content: <HomeAppsTab />,
    },
    {
      value: "tasks",
      label: "My Tasks",
      // No count badge here on purpose. It used to read `defaultTasks`, so the
      // number on the tab was fabricated — see the notice inside TasksTab.
      content: <TasksTab tasks={defaultTasks} />,
    },
  ];

  return (
    <div className="min-h-0 flex flex-col">
      <IGRPTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        items={tabs}
        variant="underline"
        className="min-w-0 flex-1 flex flex-col min-h-0"
        tabListClassName="px-4"
        tabContentClassName="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar"
      />
    </div>
  );
}
