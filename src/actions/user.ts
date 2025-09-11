'use server';

import { getIGRPAccessClient } from '@igrp/framework-next';
import { refreshAccessClient } from './igrp/auth';
import { UserFilters } from '@igrp/platform-access-management-client-ts';

export async function getUsers(params?: UserFilters) {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.users.getUsers(params);
    return result.data;
  } catch (error) {
    console.error('[igrp-users] Erro ao carregar lista de utilizadores.:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.users.getCurrentUser();
    return result.data;
  } catch (error) {
    console.error('[igrp-user] Erro ao carregar os dados do utilizador atual.:', error);
    throw error;
  }
}

// function buildQueryString(params: Record<string, string | number | undefined>): string {
//   const validParams = Object.entries(params)
//     .filter(([, value]) => value !== undefined)
//     .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);

//   return validParams.length > 0 ? `?${validParams.join('&')}` : '';
// }

// export async function getAllUsers(params?: UserQueryParams, ids?: number[]) {
//   const queryString = params
//     ? buildQueryString(params as Record<string, string | number | undefined>)
//     : '';
//   const bodyToSend = ids || [];
//   return callApi<UserProps[]>(`/api/getUsers${queryString}`, {
//     method: 'POST',
//     body: JSON.stringify(bodyToSend),
//   });
// }

// export async function getUser() {
//   return callApi<UserProps>('/api/users/currentUser');
// }

// export async function deleteUser(username: string) {
//   return callApi<void>(`/api/users/${username}`, {
//     method: 'DELETE',
//   });
// }

// export async function getApps() {
//   return callApi<OptionsProps[]>(`/api/applications`, {
//     method: 'GET',
//   });
// }

// export async function getDepartment(appCode?: string) {
//   if (!appCode) {
//     throw new Error('Application code is required');
//   }
//   return callApi<DepartmentProps[]>(`/api/applications/${appCode}/departments`, {
//     method: 'GET',
//   });
// }

// export async function getRoles(appCode?: string, departmentCode?: string) {
//   if (!appCode || !departmentCode) {
//     throw new Error('Application code and department code are required');
//   }
//   return callApi<string[]>(`/api/applications/${appCode}/departments/${departmentCode}/roles`, {
//     method: 'GET',
//   });
// }

// export async function inviteUser(params: InviteUserProps) {
//   const { email, appCode, departmentCode, roles } = params;

//   if (!email || !appCode || !departmentCode || !roles) {
//     throw new Error('Email, application code, department code, and roles are required');
//   }

//   return callApi(`/api/users/invite`, {
//     method: 'POST',
//     body: JSON.stringify({
//       email,
//       application: appCode,
//       department: departmentCode,
//       role: roles,
//     }),
//   });
// }

// export async function getRolesFromUser(id?: string) {
//   if (!id) {
//     throw new Error('ID is required');
//   }

//   return callApi<string[]>(`/api/users/${id}/roles`, {
//     method: 'GET',
//   });
// }

// export async function updateUserProfile(formData: FormData) {
//   const fullName = formData.get('fullname')?.toString() ?? '';
//   const email = formData.get('email')?.toString() ?? '';

//   if (!fullName || !email) {
//     throw new Error('Full name and email are required');
//   }

//   const newFormData = new FormData();

//   for (const [key, value] of formData.entries()) {
//     if (key !== 'fullname' && key !== 'email') {
//       newFormData.append(key, value);
//     }
//   }

//   return callApi(`/api/users/profile`, {
//     method: 'PATCH',
//     body: newFormData,
//     headers: {}, // Deixa o fetch definir o boundary correto para o FormData
//   });
// }

// export async function getUserImage() {
//   return callApi<{ link: string }>('/api/users/profile/picture', {
//     method: 'GET',
//   });
// }

// export async function getUserSignature() {
//   return callApi<{ link: string }>('/api/users/profile/signature', {
//     method: 'GET',
//   });
// }
