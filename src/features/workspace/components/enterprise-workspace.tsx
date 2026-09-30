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

const SHELL = "flex w-full flex-col mx-auto max-w-7xl";
const PANEL = "p-4";

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: IGRPTabItem[] = [
    {
      value: "home",
      label: "Início e aplicações",
      content: <HomeAppsTab />,
    },
    // {
    //   value: "tasks",
    //   label: "As minhas tarefas",
    //   content: <TasksTab tasks={defaultTasks} />,
    // },
  ];

  /**
   * A tab strip with one tab is a non-affordance: it costs a full row plus its
   * bottom border and implies navigation that does not exist. While Tasks is
   * commented out above, render the panel on its own — and pick the strip back
   * up automatically the moment a second tab returns, so re-enabling Tasks
   * stays a one-line change.
   */
  if (tabs.length < 2) {
    return (
      <div className={SHELL}>
        <div className={PANEL}>{tabs[0].content}</div>
      </div>
    );
  }

  return (
    <div className={SHELL}>
      <IGRPTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        items={tabs}
        variant="underline"
        className="flex min-w-0 flex-col"
        tabListClassName="px-4 lg:px-6"
        tabContentClassName={PANEL}
      />
    </div>
  );
}
