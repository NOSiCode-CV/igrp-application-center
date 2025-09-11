// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// import { Resource, CreateResourceDto, UpdateResourceDto } from '@/features/resources/types';
// import {
//   createResource,
//   deleteResource,
//   getAllResources,
//   getResourceById,
//   updateResource,
// } from '@/actions/resources';

// export const useResources = () => {
//   return useQuery<Resource[]>({
//     queryKey: ['resources'],
//     queryFn: getAllResources,
//   });
// };

// export const useResourceById = (id: number) => {
//   return useQuery<Resource>({
//     queryKey: ['resources', id],
//     queryFn: () => getResourceById(id),
//     enabled: !!id,
//   });
// };

// export const useCreateResource = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateResourceDto) => createResource(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resources'] });
//     },
//   });
// };

// export const useUpdateResource = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: UpdateResourceDto }) => updateResource(id, data),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['resources'] });
//       queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
//     },
//   });
// };

// export const useDeleteResource = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => deleteResource(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['resources'] });
//     },
//   });
// };

// // Hook para resources por aplicação
// export const useResourcesByApplication = (appCode: string) => {
//   return useQuery<Resource[]>({
//     queryKey: ['resources', 'application', appCode],
//     queryFn: getAllResources,
//     select: (data) => data?.filter((resource) => resource.applicationCode === appCode),
//     enabled: !!appCode,
//   });
// };
