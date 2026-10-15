"use client";

import type React from "react";
import { useId } from "react";

import {
  Button,
  IGRPIcon,
  Label,
  Pagination,
  PaginationContent,
  PaginationItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";

export interface SelectableDataTableProps<TData> {
  table: TanstackTable<TData>;
  columnCount: number;
  emptyMessage?: string;
  rowsPerPageLabel?: string;
  pageSizes?: number[];
}

export function SelectableDataTable<TData>({
  table,
  columnCount,
  emptyMessage = "Sem resultados!",
  rowsPerPageLabel = "Linhas por página",
  pageSizes = [5, 10],
}: SelectableDataTableProps<TData>): React.JSX.Element {
  const id = useId();

  const { pageIndex, pageSize } = table.getState().pagination;
  const rowCount = table.getRowCount();
  const start = pageIndex * pageSize + 1;
  const end = Math.min(Math.max(pageIndex * pageSize + pageSize, 0), rowCount);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="h-12"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center grow justify-end gap-3">
          <Label htmlFor={`${id}-per-page`} className="max-sm:sr-only">
            {rowsPerPageLabel}
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger
              id={`${id}-per-page`}
              className="w-fit whitespace-nowrap"
            >
              <SelectValue placeholder="Selecionar número de resultados" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
              {pageSizes.map((ps) => (
                <SelectItem key={ps} value={ps.toString()}>
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground flex text-sm whitespace-nowrap">
          <p
            className="text-muted-foreground text-sm whitespace-nowrap"
            aria-live="polite"
          >
            <span className="text-foreground">
              {start}-{end}
            </span>{" "}
            de <span className="text-foreground">{rowCount.toString()}</span>
          </p>
        </div>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Ir para a primeira página"
                >
                  <IGRPIcon iconName="ChevronFirst" aria-hidden />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Ir para a página anterior"
                >
                  <IGRPIcon iconName="ChevronLeft" aria-hidden />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Ir para a página seguinte"
                >
                  <IGRPIcon iconName="ChevronRight" aria-hidden />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Ir para a última página"
                >
                  <IGRPIcon iconName="ChevronLast" aria-hidden />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
