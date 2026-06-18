"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from "@igrp/igrp-framework-react-design-system";
import { useVirtualizer } from "@tanstack/react-virtual";

import { LUCIDE_ICON_OPTIONS } from "@/features/menus/menu-constants";
import { cn } from "@/lib/utils";

interface MenuIconPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MenuIconPicker({
  value,
  onChange,
  disabled,
}: MenuIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setReady(false);
      const id = window.requestIdleCallback
        ? window.requestIdleCallback(() => setReady(true))
        : window.setTimeout(() => setReady(true), 0);
      return () => {
        if ("cancelIdleCallback" in window) {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id);
        }
      };
    }
    setReady(false);
    setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LUCIDE_ICON_OPTIONS;
    return LUCIDE_ICON_OPTIONS.filter(
      (o) =>
        String(o.value).toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q),
    );
  }, [query]);

  const currentIcon = useMemo(
    () => LUCIDE_ICON_OPTIONS.find((icon) => icon.value === value),
    [value],
  );

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
  };

  return (
    <FormItem>
      <FormLabel>Ícone</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {currentIcon ? (
                <div className="flex items-center gap-2">
                  <IGRPIcon
                    iconName={String(currentIcon.value)}
                    className="size-4"
                  />
                  <span>{currentIcon.label}</span>
                </div>
              ) : (
                "Selecionar ícone..."
              )}
              <IGRPIcon iconName="ChevronsUpDown" />
            </Button>
          </FormControl>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <div className="flex flex-col">
            <div className="relative border-b">
              <IGRPIcon
                iconName="Search"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Procurar ícone..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="border-0 rounded-none focus-visible:ring-0 pl-9 h-9"
              />
              {!ready && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <IGRPIcon
                    iconName="LoaderCircle"
                    className="size-4 animate-spin"
                  />
                </div>
              )}
            </div>

            {!ready ? (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                    key={i}
                    className="h-9 rounded-sm"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum ícone encontrado.
              </p>
            ) : (
              <IconVirtualList
                icons={filtered}
                query={query}
                selectedValue={value}
                onSelect={(iconValue) => {
                  onChange(iconValue);
                  setOpen(false);
                }}
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}

function IconVirtualList({
  icons,
  query,
  selectedValue,
  onSelect,
}: {
  icons: typeof LUCIDE_ICON_OPTIONS;
  query: string;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: icons.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  return (
    <div
      key={query}
      ref={parentRef}
      className="max-h-80 overflow-y-auto p-1"
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const iconData = icons[virtualRow.index];
          const isSelected = iconData.value === selectedValue;
          return (
            <div
              key={iconData.value}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(String(iconData.value))}
                className={cn(
                  "flex w-full items-center gap-3 rounded-sm px-2 h-9 text-sm cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent text-accent-foreground",
                )}
              >
                <IGRPIcon
                  iconName={String(iconData.value)}
                  className="size-4 shrink-0"
                />
                <span className="truncate flex-1 text-left">
                  {iconData.label}
                </span>
                <IGRPIcon
                  iconName="Check"
                  className={cn(
                    "size-4 shrink-0 opacity-0",
                    isSelected && "opacity-100",
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
