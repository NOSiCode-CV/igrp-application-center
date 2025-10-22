import { DepartmentArgs } from "./dept-schemas";

export type DepartmentOption = { value: string; label: string };

export const DEPT_OPTIONS = (
  departments: DepartmentArgs[],
): DepartmentOption[] =>
  departments.map((d) => ({
    value: String(d.code),
    label: String(d.name),
  }));
