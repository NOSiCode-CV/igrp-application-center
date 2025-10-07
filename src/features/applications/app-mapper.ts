import type { IGRPApplicationArgs, IGRPStatus } from '@igrp/framework-next-types';
import type {
  ApiResponse,
  ApplicationDTO,
  ApplicationType,
  Status,
  UpdateApplicationRequest,
} from '@igrp/platform-access-management-client-ts';
import { ApplicationArgs } from './app-schemas';

// TODO: refactor the type from the accessmanagement-client-ts to match IGRPApplicationArgs

const mapApplication = (app: ApplicationDTO): IGRPApplicationArgs => ({
  id: app.id as number,
  code: app.code,
  name: app.name,
  description: app.description,
  status: app.status as IGRPStatus,
  type: app.type,
  owner: app.owner || undefined,
  picture: app.picture,
  url: app.url || undefined,
  slug: app.slug || undefined,
  departments: app.departments,
  createdBy: app.createdBy || undefined,
  createdDate: app.createdDate || undefined,
  lastModifiedBy: app.lastModifiedBy || undefined,
  lastModifiedDate: app.lastModifiedDate || undefined,
});

export const mapperApplications = (apps: ApiResponse<ApplicationDTO[]>): IGRPApplicationArgs[] => {
  if (!apps.data) return [];
  return apps.data.map(mapApplication);
};

export const mapperActionsApplication = (app: ApiResponse<ApplicationDTO>): IGRPApplicationArgs => {
  if (!app.data) return {} as IGRPApplicationArgs;
  return mapApplication(app.data);
};

export const mapperUpdateApplication = (payload: ApplicationArgs): UpdateApplicationRequest => ({
  code: payload.code,
  name: payload.name,
  description: payload.description,
  status: payload.status as Status,
  type: payload.type as ApplicationType,
  owner: payload.owner,
  picture: payload.picture,
  url: payload.url,
  slug: payload.slug,
});
