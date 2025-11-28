"use client";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
import {
  IGRPBadge,
  IGRPBadgePrimitive,
  IGRPCalendarSingle,
  IGRPCard,
  IGRPInputText,
  IGRPSeparator,
  IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";
import { useState } from "react";

const initialTasks = [
  {
    id: "1",
    title: "Analisar pedido de licenciamento ambiental",
    priority: "high",
    dueDate: "Hoje",
    processName: "Licenciamento Ambiental",
    processCode: "LIC-2024-0892",
  },
  {
    id: "2",
    title: "Elaborar parecer técnico sobre obra pública",
    priority: "high",
    dueDate: "Hoje",
    processName: "Fiscalização de Obras",
    processCode: "OBR-2024-0156",
  },
  {
    id: "3",
    title: "Revisar minuta de contrato de licitação",
    priority: "medium",
    dueDate: "Amanhã",
    processName: "Pregão Eletrônico",
    processCode: "PGE-2024-0043",
  },
  {
    id: "4",
    title: "Responder manifestação da ouvidoria",
    priority: "medium",
    dueDate: "Amanhã",
    processName: "Ouvidoria Municipal",
    processCode: "OUV-2024-1204",
  },
  {
    id: "5",
    title: "Validar folha de pagamento do mês",
    priority: "high",
    dueDate: "Esta semana",
    processName: "Folha de Pagamento",
    processCode: "FPG-2024-0011",
  },
  {
    id: "6",
    title: "Atualizar cadastro imobiliário",
    priority: "low",
    dueDate: "Esta semana",
    processName: "Cadastro de Imóveis",
    processCode: "CAD-2024-0567",
  },
  {
    id: "7",
    title: "Emitir certidão negativa de débitos",
    priority: "medium",
    dueDate: "Esta semana",
    processName: "Atendimento ao Contribuinte",
    processCode: "CND-2024-2341",
  },
];

export default function HomeIGRP() {
  const [tasks, setTasks] = useState(initialTasks);
  const [taskSearch, setTaskSearch] = useState("");
 const [date, setDate] = useState<Date | undefined>(new Date())

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.processName.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.processCode.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesSearch;
  });

  const tabs: IGRPTabItem[] = [
    {
      label: "Tarrefas",
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
          <div className="pb-2">
            <span className="text-sm text-muted-foreground">
              {filteredTasks.length} tarefas pendentes
            </span>
          </div>
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
                      <IGRPBadgePrimitive
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {task.processCode}
                      </IGRPBadgePrimitive>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate}
                      </span>
                      <IGRPBadgePrimitive
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
                      </IGRPBadgePrimitive>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa encontrada</p>
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
      <>
  <IGRPCalendarSingle
    date={date}
    onDateChange={setDate}
    className="rounded-md border w-full"
  />
  <IGRPSeparator className="my-4" />
  <div className="space-y-3">
    <h4 className="text-sm font-semibold">Próximos Compromissos</h4>
    <ScrollArea className="h-[190px] -mr-4 pr-4">
      <div className="space-y-2 pb-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Reunião de Gabinete
            </p>
            <p className="text-xs text-muted-foreground">Hoje, 10:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Audiência Pública
            </p>
            <p className="text-xs text-muted-foreground">Hoje, 14:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Sessão de Licitação
            </p>
            <p className="text-xs text-muted-foreground">Amanhã, 09:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Reunião Departamental
            </p>
            <p className="text-xs text-muted-foreground">Amanhã, 15:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Vistoria de Obra
            </p>
            <p className="text-xs text-muted-foreground">Sexta, 08:00</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Apresentação de Projeto
            </p>
            <p className="text-xs text-muted-foreground">Sexta, 16:00</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</>
      ),
    },
  ];

  return (
    <div className=" max-w-[1600px] mx-auto p-6">
      <div className="flex flex-col lg:flex-row! gap-8">
        <div className="flex-1 space-y-8">
          <ApplicationsListHome />
        </div>

        <aside className="w-full lg:w-80! xl:w-96! shrink-0 lg:sticky! lg:top-6 lg:self-start">
          <IGRPCard className="px-4">
            <IGRPTabs
              defaultValue="task"
              items={tabs}
              className="min-w-0"
              tabContentClassName="px-0"
              fullWidth
              orientation="horizontal"
            />
          </IGRPCard>
        </aside>
      </div>
    </div>
  );
}
