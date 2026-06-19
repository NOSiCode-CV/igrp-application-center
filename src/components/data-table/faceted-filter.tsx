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
} from "@igrp/igrp-framework-react-design-system";

export interface FacetedFilterOption {
  value: string;
  label: string;
}

interface FacetedFilterProps {
  label: string;
  options: readonly FacetedFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function FacetedFilter({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: FacetedFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <IGRPIcon iconName="ListFilter" aria-hidden="true" strokeWidth={2} />
          {label} {value.length > 0 && `(${value.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => {
              onChange(
                checked
                  ? [...value, option.value]
                  : value.filter((v) => v !== option.value),
              );
            }}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange([])}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              <IGRPIcon
                iconName="X"
                aria-hidden="true"
                className="mr-1"
                strokeWidth={2}
              />
              Limpar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
