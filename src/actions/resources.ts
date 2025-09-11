// 'use server';

// import { Resource, CreateResourceDto, UpdateResourceDto } from '@/features/resources/types';
// import { callApi } from '@/lib/api-client';

// export async function getAllResources(): Promise<Resource[]> {
//   return callApi<Resource[]>('/api/resources');
// }

// export async function getResourceById(id: number): Promise<Resource> {
//   return callApi<Resource>(`/api/resources/${id}`);
// }

// export async function createResource(data: CreateResourceDto): Promise<Resource> {
//   return callApi<Resource>('/api/resources', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   });
// }

// export async function updateResource(id: number, data: UpdateResourceDto): Promise<Resource> {
//   return callApi<Resource>(`/api/resources/${id}`, {
//     method: 'PATCH',
//     body: JSON.stringify(data),
//   });
// }

// export async function deleteResource(id: number): Promise<void> {
//   await callApi<void>(`/api/resources/${id}`, {
//     method: 'DELETE',
//   });
// }
