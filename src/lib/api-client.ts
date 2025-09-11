// 'use server';

// import { getIGRPAccessClient } from '@igrp/framework-next';
// import { redirect } from 'next/navigation';

// import { serverSession } from '@/actions/igrp/auth';

// interface ExtendedRequestInit extends RequestInit {
//   isTextResponse?: boolean;
// }

// export async function callApi<T>(endpoint: string, options: ExtendedRequestInit = {}): Promise<T> {
//   const API_URL = process.env.IGRP_APP_MANAGER_API ?? '';
//   const session = await serverSession();

//   if (!session?.accessToken) {
//     redirect('/logout');
//   }

//   if (!API_URL) {
//     throw new Error(
//       '[apps-center]: A variável de ambiente IGRP_APP_MANAGER_API não está definida.',
//     );
//   }

//   const client = await getIGRPAccessClient();

//   const url = `${API_URL}${endpoint}`;

//   const baseHeaders: Record<string, string> = {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${session.accessToken}`,
//     ...((options.headers as Record<string, string>) || {}),
//   };

//   // Remove Content-Type for FormData
//   if (options.body instanceof FormData) {
//     delete baseHeaders['Content-Type'];
//   }

//   const response = await fetch(url, {
//     ...options,
//     headers: baseHeaders,
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.message || `API Error (${response.status})`);
//   }

//   if (options.isTextResponse) {
//     return (await response.text()) as unknown as T;
//   }

//   // Handle 204 No Content (delete operations) or empty responses
//   if (response.status === 204 || response.headers.get('content-length') === '0') {
//     return {} as T;
//   }

//   return (await response.json()) as T;
// }
