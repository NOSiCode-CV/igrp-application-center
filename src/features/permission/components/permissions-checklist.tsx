'use client';

import { useEffect, useId, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  // IGRPLabelPrimitive,
  IGRPPaginationContentPrimitive,
  IGRPPaginationItemPrimitive,
  IGRPPaginationPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { showStatus, statusClass } from '@/lib/utils';
import { PermissionArgs } from '../permissions-schemas';
import { usePermissions } from '../use-permission';

const columns: ColumnDef<PermissionArgs>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <IGRPCheckboxPrimitive
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='ring ring-current/50'
      />
    ),
    cell: ({ row }) => (
      <IGRPCheckboxPrimitive
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='ring ring-current/50'
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
    enableSorting: false,
  },
  {
    header: 'Descrição',
    accessorKey: 'description',
    cell: ({ row }) => <div>{row.getValue('description') || 'N/A'}</div>,
    enableSorting: false,
  },
  {
    header: 'Estado',
    accessorKey: 'status',
    cell: ({ row }) => (
      <IGRPBadgePrimitive className={cn(statusClass(row.getValue('status')), 'capitalize')}>
        {showStatus(row.getValue('status'))}
      </IGRPBadgePrimitive>
    ),
    size: 40,
    enableSorting: false,
  },
];

export function PermissionsCheckList({ departmentCode }: { departmentCode: string }) {
  const id = useId();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [data, setData] = useState<PermissionArgs[]>([]);

  const { data: permissions, isLoading, error } = usePermissions({ departmentCode });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  useEffect(() => {
    setData(permissions || []);
  }, [permissions]);

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar permissões.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='grid gap-4 animate-pulse'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='h-12 rounded-lg bg-muted'
            />
          ))}
        </div>
      ) : (
        <>
          <div className='bg-background overflow-hidden rounded-md border'>
            <IGRPTablePrimitive className='table-fixed'>
              <IGRPTableHeaderPrimitive>
                {table.getHeaderGroups().map((headerGroup) => (
                  <IGRPTableRowPrimitive
                    key={headerGroup.id}
                    className='hover:bg-transparent'
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <IGRPTableHeadPrimitive
                          key={header.id}
                          style={{ width: `${header.getSize()}px` }}
                          className='h-12'
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </IGRPTableHeadPrimitive>
                      );
                    })}
                  </IGRPTableRowPrimitive>
                ))}
              </IGRPTableHeaderPrimitive>
              <IGRPTableBodyPrimitive>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <IGRPTableRowPrimitive
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <IGRPTableCellPrimitive key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </IGRPTableCellPrimitive>
                      ))}
                    </IGRPTableRowPrimitive>
                  ))
                ) : (
                  <IGRPTableRowPrimitive>
                    <IGRPTableCellPrimitive
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      Sem resultados!
                    </IGRPTableCellPrimitive>
                  </IGRPTableRowPrimitive>
                )}
              </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between gap-8'>
            {/* Results per page */}
            <div className='flex items-center gap-3'>
              <label
                htmlFor={id}
                className='max-sm:sr-only'
              >
                Rows per page
              </label>
              <IGRPSelectPrimitive
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <IGRPSelectTriggerPrimitive
                  id={id}
                  className='w-fit whitespace-nowrap'
                >
                  <IGRPSelectValuePrimitive placeholder='Select number of results' />
                </IGRPSelectTriggerPrimitive>
                <IGRPSelectContentPrimitive className='[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2'>
                  {[5, 10, 25, 50].map((pageSize) => (
                    <IGRPSelectItemPrimitive
                      key={pageSize}
                      value={pageSize.toString()}
                    >
                      {pageSize}
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
            </div>
            {/* Page number information */}
            <div className='text-muted-foreground flex grow justify-end text-sm whitespace-nowrap'>
              <p
                className='text-muted-foreground text-sm whitespace-nowrap'
                aria-live='polite'
              >
                <span className='text-foreground'>
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                  -
                  {Math.min(
                    Math.max(
                      table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                        table.getState().pagination.pageSize,
                      0,
                    ),
                    table.getRowCount(),
                  )}
                </span>{' '}
                of <span className='text-foreground'>{table.getRowCount().toString()}</span>
              </p>
            </div>
            {/* Pagination IGRPbuttonPrimitives */}
            <div>
              <IGRPPaginationPrimitive>
                <IGRPPaginationContentPrimitive>
                  {/* First page IGRPbuttonPrimitive */}
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.firstPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label='Go to first page'
                    >
                      <IGRPIcon iconName='ChevronFirst' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  {/* Previous page IGRPbuttonPrimitive */}
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label='Go to previous page'
                    >
                      <IGRPIcon iconName='ChevronLeft' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  {/* Next page IGRPbuttonPrimitive */}
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label='Go to next page'
                    >
                      <IGRPIcon iconName='ChevronRight' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  {/* Last page IGRPbuttonPrimitive */}
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.lastPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label='Go to last page'
                    >
                      <IGRPIcon iconName='ChevronLast' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                </IGRPPaginationContentPrimitive>
              </IGRPPaginationPrimitive>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
