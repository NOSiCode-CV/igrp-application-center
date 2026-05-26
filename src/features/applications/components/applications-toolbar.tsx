"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ApplicationsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (next: string[]) => void;
  disabled?: boolean;
}

export function ApplicationsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
}: ApplicationsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
      <div className="relative w-full max-w-sm">
        <IGRPIcon
          iconName="Search"
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="search"
          placeholder="Pesquisar aplicações..."
          className="w-full bg-background pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={disabled}>
              <IGRPIcon iconName="ListFilter" strokeWidth={2} />
              Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={statusFilter.includes(value)}
                onCheckedChange={(checked) => {
                  onStatusFilterChange(
                    checked
                      ? [...statusFilter, value]
                      : statusFilter.filter((s) => s !== value),
                  );
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onStatusFilterChange([])}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  <IGRPIcon iconName="X" className="mr-1" strokeWidth={2} />
                  Limpar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
