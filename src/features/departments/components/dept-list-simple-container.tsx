"use client";

import {
  cn,
  IGRPIcon,
  IGRPInputPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import DepartmentTreeItemSimple from "./dept-list-simple-tree";
import { buildTree, filterTree } from "./dept-list-tree";
import { useCurrentUserDepartments } from "@/features/users/use-users";

export function DepartmentListSimple() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { data: departments } = useCurrentUserDepartments();

  const departmentTree = buildTree(departments as any);
  const filteredTree = filterTree(departmentTree, searchTerm);

  return (
    <div className="w-full ">
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
