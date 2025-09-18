'use server';

import { igrpGetAccessClient, igrpResetAccessClient } from '@igrp/framework-next';
import {  } from './igrp/auth';
import { UserFilters } from '@igrp/platform-access-management-client-ts';

export async function getUsers(params?: UserFilters) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.users.getUsers(params);
    return result.data;
  } catch (error) {
    console.error('[igrp-users] Erro ao carregar lista de utilizadores.:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.users.getCurrentUser();
    return result.data;
  } catch (error) {
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
}