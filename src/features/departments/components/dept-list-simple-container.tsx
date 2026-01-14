"use client";

import {
  cn,
  IGRPIcon,
  IGRPInputPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import DepartmentTreeItemSimple from "./dept-list-simple-tree";
import { buildTree, filterTree } from "./dept-list-tree";
import {
  useCurrentUserDepartments,
  useUserDepartments,
} from "@/features/users/use-users";
import { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { AppCenterLoading } from "@/components/loading";

export function DepartmentListSimple({ user }: { user?: IGRPUserDTO }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { data: currentUserDepts, isLoading: isLoadingMyDeps, error: errorMyDeps } =
    useCurrentUserDepartments({ enabled: !user });
  const { data: userDepts, isLoading, error } = useUserDepartments(user?.id!, {
    enabled: !!user,
  });

  if (isLoadingMyDeps || isLoading  && !error && !errorMyDeps) {
    return <AppCenterLoading descrption="Carregando departamentos..." />;
  }

  const departments = user ? userDepts : currentUserDepts;
  const departmentTree = buildTree(departments as any);

  const filteredTree = filterTree(departmentTree, searchTerm);

  return (
    <div className="w-full ">
      {filteredTree.length > 0 && (
        <div className="relative mb-4 max-w-md">
          <IGRPIcon
            iconName="Search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <IGRPInputPrimitive
            type="text"
            placeholder="Pesquisar departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background pl-8"
          />
        </div>
      )}

      {filteredTree.length === 0 && (
        <div className="w-full">
          <div className="text-primary">
            <p className="text-sm">Nenhum departamento</p>
          </div>
        </div>
      )}

      <div className="overflow-y-auto">
        {filteredTree.map((dept) => (
          <DepartmentTreeItemSimple
            key={dept.code}
            dept={dept as any}
            expandedDepts={expandedDepts}
            setExpandedDepts={setExpandedDepts}
          />
        ))}
      </div>
    </div>
  );
}
