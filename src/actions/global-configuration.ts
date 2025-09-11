// 'use server';

// import { Application } from '@/features/applications/types';
// import { callApi } from '@/lib/api-client';

// export async function getApplications() {
//   return callApi<Application[]>('/api/applications');
// }

// export async function getApplicationById(id: number) {
//   return callApi<Application>(`/api/applications/${id}`);
// }

// export async function getAppImage(appId: number) {
//   return callApi<string>(`/apps/${appId}/getPicture`, {
//     method: 'GET',
//     isTextResponse: true,
//   });
// }

// export async function createApplication(application: Omit<Application, 'id' | 'creationDate'>) {
//   return callApi<Application>('/api/applications', {
//     method: 'POST',
//     body: JSON.stringify(application),
//   });
// }

// export async function updateApplication(id: number, updated: Partial<Application>) {
//   return callApi<Application>(`/api/applications/${id}`, {
//     method: 'PUT',
//     body: JSON.stringify(updated),
//   });
// }

// export async function deleteApplication(id: number) {
//   return callApi<void>(`/api/applications/${id}`, {
//     method: 'DELETE',
//   });
// }
