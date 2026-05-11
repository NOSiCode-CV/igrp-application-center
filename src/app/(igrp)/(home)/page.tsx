"use client";
import {
  Badge,
  Calendar,
  Card,
  IGRPIcon,
  IGRPInputText,
  type IGRPTabItem,
  IGRPTabs,
  ScrollArea,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";

interface DashboardTask {
  id: string;
  title: string;
  processName: string;
  processCode: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

const initialTasks: DashboardTask[] = [];

export default function HomeIGRP() {
  const tasks = initialTasks;
  const [taskSearch, setTaskSearch] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.processName.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.processCode.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesSearch;
  });

  const tabs: IGRPTabItem[] = [
    {
      label: "Tarefas",
      value: "task",
      content: (
        <>
          <div className="pb-3">
            <div className="relative">
              <IGRPInputText
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Pesquisar tarefas..."
                className="h-9 text-sm"
                iconName="Search"
                showIcon
              />
            </div>
          </div>
          {filteredTasks && filteredTasks.length > 0 && (
            <div className="pb-2">
              <span className="text-sm text-muted-foreground">
                {filteredTasks.length} tarefas pendentes
              </span>
            </div>
          )}
          <ScrollArea className="h-[calc(90vh-300px)] -mr-4 pr-4">
            <div className="pb-4 space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {task.processName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {task.processCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate}
                      </span>
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {task.priority === "high"
                          ? "Alta"
                          : task.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center justify-center py-8 text-muted-foreground">
                  <IGRPIcon
                    iconName="ClipboardCheck"
                    size="xl"
                    className="h-10 w-10 mx-auto"
                  />
                  <p className="text-sm pt-2">Nenhuma tarefa encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      ),
    },
    {
      label: "Agenda",
      value: "agenda",
      content: (
        <div className="flex flex-col justify-between">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border w-full"
          />
          {/* <IGRPSeparator className="my-4" /> */}
          <div className="space-y-3">
            {/* <h4 className="text-sm font-semibold">Próximos Compromissos</h4> */}
            <ScrollArea className="h-48 -mr-4 pr-4">
              <div className="space-y-2 pb-4">
                {/* <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Reunião de Gabinete
            </p>
            <p className="text-xs text-muted-foreground">Hoje, 10:00</p>
          </div>
        </div> */}

                <div className="text-center py-8 text-muted-foreground">
                  <IGRPIcon
                    iconName="CalendarX2"
                    size="xl"
                    className="h-10 w-10 mx-auto"
                  />
                  <p className="text-sm pt-2">Nenhum compromisso agendado</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col lg:flex-row! gap-8">
        <div className="flex-1 space-y-8">
          <ApplicationsListHome />
        </div>

        <aside className="w-full lg:w-80! xl:w-96! shrink-0 lg:sticky! lg:top-6 lg:self-start">
          <Card className="px-4">
            <IGRPTabs
              defaultValue="task"
              items={tabs}
              className="min-w-0"
              tabContentClassName="px-0"
              fullWidth
              orientation="horizontal"
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
