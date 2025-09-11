'use client';

import Link from 'next/link';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IGRPSeparatorPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import {
  useCurrentPermission,
  usePermissionRoles,
} from '@/features/permission/hooks/use-permission';
import { useApplications } from '@/features/applications/use-applications';
import { PermissionRolesList } from './permission-roles-list';

export function PermissionDetails({ id }: { id: number }) {
  const { data: permission, isLoading, error } = useCurrentPermission(id);
  const { data: permissionRoles } = usePermissionRoles(id);
  const { data: applications } = useApplications();

  if (isLoading) return <div>Loading permission...</div>;
  if (error) throw error;
  if (!permission) return <div>Permission not found.</div>;

  const getAppName = (appId: number) => {
    return applications?.find((app) => app.id === appId)?.name || `App ${appId}`;
  };

  return (
    <section className='space-y-10'>
      <div className='space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <PageHeader
            title={permission.name}
            showBackButton
            linkBackButton='/permissions'
          >
            <Button asChild>
              <Link href={`/permissions/${id}/edit`}>
                <Edit /> Edit Permission
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className='flex flex-col gap-8 animate-fade-in motion-reduce:hidden'>
          <Card className='overflow-hidden card-hover gap-3'>
            <CardHeader>
              <CardTitle>Permission Information</CardTitle>
              <CardDescription>Detailed information about this permission.</CardDescription>
              <Separator className='my-2' />
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Name</h3>
                  <p className='font-medium'>{permission.name}</p>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Status</h3>
                  <Badge variant={permission.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {permission.status}
                  </Badge>
                </div>
                <div>
                  <h3 className='font-normal text-muted-foreground'>Application</h3>
                  <p>{getAppName(permission.applicationId)}</p>
                </div>
                <div className='sm:col-span-2 md:col-span-3'>
                  <h3 className='font-normal text-muted-foreground'>Description</h3>
                  <p>{permission.description || 'No description provided.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        defaultValue='roles'
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='roles'>Roles ({permissionRoles?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent
          value='roles'
          className='space-y-4'
        >
          <Card>
            <CardHeader>
              <CardTitle>Permission Roles</CardTitle>
              <CardDescription>Roles that have this permission assigned.</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionRolesList
                permissionId={permission.id}
                permissionRoles={permissionRoles || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
