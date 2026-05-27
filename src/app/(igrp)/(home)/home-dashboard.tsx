"use client";
import {
  Calendar,
  Card,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPIcon,
  type IGRPTabItem,
  IGRPTabs,
  ScrollArea,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";

export function HomeDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const tabs: IGRPTabItem[] = [
    {
      label: "Tarefas",
      value: "task",
      content: (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sem tarefas</EmptyTitle>
            <EmptyDescription>
              Ainda não há tarefas atribuídas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
          <div className="flex flex-col gap-3">
            <ScrollArea className="h-48 -mr-4 pr-4">
              <div className="flex flex-col gap-2 pb-4">
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
        <div className="flex-1 flex flex-col gap-8">
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
