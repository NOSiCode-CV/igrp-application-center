'use server';

import {
  mapperApplications,
  igrpGetAccessClient,
  igrpResetAccessClient,
} from '@igrp/framework-next';
import {
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from '@igrp/platform-access-management-client-ts';

import { mapperActionsApplication } from '@/features/applications/app-mapper';

export async function getApplications() {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.applications.getApplications();
    const app = mapperApplications(result);
    return app;
  } catch (error) {
    console.error('[apps] Não foi possível obter os dados:', error);
    throw error;
  }
}

export async function getApplicationByCode(appCode: string) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.applications.getApplications({ code: appCode });
    const app = mapperApplications(result);
    return app[0];
  } catch (error) {
    console.error('[app-by-code] Não foi possível obter os dados da aplicação:', error);
    throw error;
  }
}

export async function createApplication(application: CreateApplicationRequest) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.applications.createApplication(application);
    const app = mapperActionsApplication(result);
    return app;
  } catch (error) {
    console.error('[app-create] Não foi possível criar à aplicação:', error);
    throw error;
  }
}

export async function updateApplication(code: string, updated: UpdateApplicationRequest) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.applications.updateApplication(code, updated);
    const app = mapperActionsApplication(result);
    return app;
  } catch (error) {
    console.error('[app-update] Não foi possível atualizar à aplicação:', error);
    throw error;
  }
}
