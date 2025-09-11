'use client';

import { useState } from 'react';
import { IGRPButtonPrimitive, IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { PermissionRole } from '../types';

interface PermissionRolesListProps {
  permissionId: number;
  permissionRoles: PermissionRole[];
}

export function PermissionRolesList({ permissionRoles }: PermissionRolesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PermissionRole | null>(null);

  const handleViewRole = (role: PermissionRole) => {
    setSelectedRole(role);
    setViewDialogOpen(true);
  };

  const filteredRoles = permissionRoles.filter((role) =>
    role.permission.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <div className='relative w-full max-w-sm'>
          <IGRPIcon
            iconName='Search'
            className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
          />
          <IGRPInputPrimitive
            type='search'
            placeholder='Search roles...'
            className='pl-8'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <IGRPDialogPrimitive
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        >
          <IGRPDialogContentPrimitive>
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Role Details</IGRPDialogTitlePrimitive>
              <IGRPDialogDescriptionPrimitive>
                Details for role assignment
              </IGRPDialogDescriptionPrimitive>
            </IGRPDialogHeaderPrimitive>
            <div className='py-4'>
              <h3 className='font-medium'>Permission ID</h3>
              <p className='text-sm text-muted-foreground mb-4'>{selectedRole?.permissionId}</p>

              <h3 className='font-medium'>Role ID</h3>
              <p className='text-sm text-muted-foreground mb-4'>{selectedRole?.roleId}</p>

              <h3 className='font-medium'>Permission Name</h3>
              <p className='text-sm text-muted-foreground mb-4'>{selectedRole?.permission.name}</p>

              <h3 className='font-medium'>Permission Status</h3>
              <IGRPBadgePrimitive
                variant={selectedRole?.permission.status === 'ACTIVE' ? 'default' : 'outline'}
              >
                {selectedRole?.permission.status}
              </IGRPBadgePrimitive>
            </div>
            <IGRPDialogFooterPrimitive>
              <IGRPButtonPrimitive
                variant='outline'
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
      </div>

      {filteredRoles.length === 0 ? (
        <div className='text-center py-6 text-muted-foreground'>
          No roles found.{' '}
          {searchTerm
            ? 'Try adjusting your search.'
            : 'This permission is not assigned to any roles.'}
        </div>
      ) : (
        <div className='rounded-md border'>
          <IGRPTablePrimitive>
            <IGRPTableHeaderPrimitive>
              <IGRPTableRowPrimitive>
                <IGRPTableHeadPrimitive>Role ID</IGRPTableHeadPrimitive>
                <IGRPTableHeadPrimitive>Permission</IGRPTableHeadPrimitive>
                <IGRPTableHeadPrimitive>Status</IGRPTableHeadPrimitive>
                <IGRPTableHeadPrimitive className='w-[100px]'>Actions</IGRPTableHeadPrimitive>
              </IGRPTableRowPrimitive>
            </IGRPTableHeaderPrimitive>
            <IGRPTableBodyPrimitive>
              {filteredRoles.map((role) => (
                <IGRPTableRowPrimitive key={role.id}>
                  <IGRPTableCellPrimitive className='font-medium'>
                    {role.roleId}
                  </IGRPTableCellPrimitive>
                  <IGRPTableCellPrimitive>{role.permission.name}</IGRPTableCellPrimitive>
                  <IGRPTableCellPrimitive>
                    <IGRPBadgePrimitive
                      variant={role.permission.status === 'ACTIVE' ? 'default' : 'outline'}
                    >
                      {role.permission.status}
                    </IGRPBadgePrimitive>
                  </IGRPTableCellPrimitive>
                  <IGRPTableCellPrimitive>
                    <IGRPButtonPrimitive
                      variant='ghost'
                      size='icon'
                      onClick={() => handleViewRole(role)}
                      className='h-8 w-8'
                    >
                      <IGRPIcon
                        iconName='Eye'
                        className='h-4 w-4'
                      />
                      <span className='sr-only'>View</span>
                    </IGRPButtonPrimitive>
                  </IGRPTableCellPrimitive>
                </IGRPTableRowPrimitive>
              ))}
            </IGRPTableBodyPrimitive>
          </IGRPTablePrimitive>
        </div>
      )}
    </div>
  );
}
