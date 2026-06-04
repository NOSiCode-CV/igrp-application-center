"use client";

import { Suspense, useState } from "react";

import {
  IGRPButton,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";

import UserApplications from "./user-applications";
import { UserAuditLogTab } from "./user-audit-tab";
import { UserMetadataPanel } from "./user-metadata-panel";
import UserRoleList from "./user-role-list";
import { UserSessionsTab } from "./user-sessions-tab";
import UserSignature from "./user-signature";

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function TabError({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error ? error.message : "Erro ao carregar dados";
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-sm text-destructive">
      <p>{message}</p>
      <IGRPButton size="sm" onClick={resetErrorBoundary}>
        Tentar novamente
      </IGRPButton>
    </div>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={TabError}>
      <Suspense fallback={<TabSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

type TabValue =
  | "roles"
  | "departments"
  | "applications"
  | "signature"
  | "sessions"
  | "audit"
  | "metadata";

interface UserDetailsTabsProps {
  user: IGRPUserDTO;
}

export function UserDetailsTabs({ user }: UserDetailsTabsProps) {
  const [active, setActive] = useState<TabValue>("roles");

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as TabValue)}>
      <TabsList>
        <TabsTrigger value="roles">Perfis</TabsTrigger>
        <TabsTrigger value="departments">Departamentos</TabsTrigger>
        <TabsTrigger value="applications">Aplicações</TabsTrigger>
        <TabsTrigger value="signature">Assinatura</TabsTrigger>
        <TabsTrigger value="sessions">Sessões</TabsTrigger>
        <TabsTrigger value="audit">Auditoria</TabsTrigger>
        <TabsTrigger value="metadata">Metadados</TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        {active === "roles" && (
          <TabPanel>
            <UserRoleList user={user} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="departments">
        {active === "departments" && (
          <TabPanel>
            <DepartmentListSimple user={user} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="applications">
        {active === "applications" && (
          <TabPanel>
            <UserApplications user={user} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="signature">
        {active === "signature" && (
          <TabPanel>
            <UserSignature user={user} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="sessions">
        {active === "sessions" && user.username && (
          <TabPanel>
            <UserSessionsTab username={user.username} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="audit">
        {active === "audit" && (
          <TabPanel>
            <UserAuditLogTab userId={String(user.id)} />
          </TabPanel>
        )}
      </TabsContent>

      <TabsContent value="metadata">
        {active === "metadata" && (
          <TabPanel>
            <UserMetadataPanel userId={user.id} />
          </TabPanel>
        )}
      </TabsContent>
    </Tabs>
  );
}
