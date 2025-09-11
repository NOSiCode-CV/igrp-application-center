// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { ListFilter, Search, Trash2, UserRoundPlus, X } from 'lucide-react';
// import { toast } from 'sonner';
// import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
// import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
// import {
//   IGRPTablePrimitive,
//   IGRPTableBodyPrimitive,
//   IGRPTableCellPrimitive,
//   IGRPTableHeadPrimitive,
//   IGRPTableHeaderPrimitive,
//   IGRPTableRowPrimitive,
// } from '@igrp/igrp-framework-react-design-system';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { UserDeleteDialog } from '@/features/users/components/delete-dialog';
// import { UserInviteDialog } from '@/features/users/components/invite-dialog';
// import { useAllUsers, useDeleteUser, useCurrentUser } from '@/features/users/use-users';

// export function UserList() {
//   const { data: users, isLoading, error } = useAllUsers();
//   const { mutateAsync: deleteUser } = useDeleteUser();
//   const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilters, setStatusFilters] = useState<string[]>([]);
//   const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<{ username: string; email: string } | null>(
//     null,
//   );
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

//   if (isLoading && currentUserLoading) return <div>Loading Users...</div>;

//   // TODO: error message
//   if (error) {
//     throw error;
//   }

//   if (!users || users.length === 0) {
//     return <div>No users found.</div>;
//   }

//   const handleDelete = (username: string, email: string) => {
//     setUserToDelete({ username, email });
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!userToDelete) return;

//     const promise = deleteUser(userToDelete.username);

//     toast.promise(promise, {
//       loading: 'Deleting user...',
//       success: `User '${userToDelete.email}' deleted successfully.`,
//       error: (err) => `Failed to delete: ${(err as Error).message}`,
//       duration: 2500,
//     });

//     try {
//       await promise;
//     } finally {
//       setTimeout(() => {
//         setDeleteDialogOpen(false);
//         setUserToDelete(null);
//       }, 2500);
//     }
//   };

//   const filteredUsers = users.filter(
//     (user) =>
//       (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.username?.toLowerCase().includes(searchTerm.toLowerCase())) &&
//       (statusFilters.length === 0 || statusFilters.includes(user.status)),
//   );
//   const isCurrentUser = (email: string) => {
//     if (currentUser?.email === email) return true;
//     return false;
//   };

//   return (
//     <div className='space-y-8 animate-fade-in'>
//       <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
//         <div>
//           <h1 className='text-2xl font-bold tracking-tight'>User Management</h1>
//           <p className='text-muted-foreground'>View and manage all users in the system.</p>
//         </div>
//         <Button onClick={() => setInviteDialogOpen(true)}>
//           <UserRoundPlus strokeWidth={2} /> Invite Users
//         </Button>
//       </div>

//       <div className='space-y-5 px-2'>
//         <div className='flex flex-col sm:flex-row items-start gap-4 w-full'>
//           <div className='relative w-full max-w-sm'>
//             <Search
//               className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
//               strokeWidth={2}
//             />
//             <Input
//               type='search'
//               placeholder='Search users...'
//               className='w-full bg-background pl-8'
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <div className='flex flex-wrap gap-2'>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button
//                   variant='outline'
//                   className='gap-2'
//                 >
//                   <ListFilter strokeWidth={2} />
//                   Status {statusFilters.length > 0 && `(${statusFilters.length})`}
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent
//                 align='start'
//                 className='w-40'
//               >
//                 <DropdownMenuSeparator />
//                 {['ACTIVE', 'INACTIVE'].map((status) => (
//                   <DropdownMenuCheckboxItem
//                     key={status}
//                     checked={statusFilters.includes(status)}
//                     onCheckedChange={(checked) => {
//                       setStatusFilters(
//                         checked
//                           ? [...statusFilters, status]
//                           : statusFilters.filter((s) => s !== status),
//                       );
//                     }}
//                   >
//                     <span className='capitalize'>{status?.toLowerCase()}</span>
//                   </DropdownMenuCheckboxItem>
//                 ))}
//                 {statusFilters.length > 0 && (
//                   <>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem
//                       onClick={() => setStatusFilters([])}
//                       className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
//                     >
//                       <X
//                         className='mr-2'
//                         strokeWidth={2}
//                       />
//                       Clear filters
//                     </DropdownMenuItem>
//                   </>
//                 )}
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>

//         <div className='border rounded-md'>
//           <Table>
//             <TableHeader className='bg-muted'>
//               <TableRow className='border-b dark:border-slate-800/60'>
//                 <TableHead className='px-4 py-3 font-semibold'>User Name</TableHead>
//                 <TableHead className='px-4 py-3 font-semibold'>Email</TableHead>
//                 <TableHead className='px-4 py-3 font-semibold'>Full Name</TableHead>
//                 {/* <TableHead className='px-4 py-3 font-semibold'>Status</TableHead> */}
//                 <TableHead className='w-[100px]'></TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredUsers.length === 0 ? (
//                 <TableRow className='hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg'>
//                   <TableCell
//                     colSpan={12}
//                     className='h-24 text-center font-semibold'
//                   >
//                     No users found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredUsers.map((user, i) => (
//                   <TableRow
//                     key={`user-${i}`}
//                     className='border-b dark:border-slate-800/60'
//                   >
//                     <TableCell className='p-4 text-base'>
//                       {isCurrentUser(user.email) ? (
//                         <TooltipProvider delayDuration={0}>
//                           <Tooltip>
//                             <TooltipTrigger asChild>
//                               <Link
//                                 href={'/users/profile'}
//                                 className='underline underline-offset-2 hover:text-primary hover:no-underline'
//                               >
//                                 {user.username}
//                               </Link>
//                             </TooltipTrigger>
//                             <TooltipContent className='px-2 py-1 text-xs'>
//                               View Profile
//                             </TooltipContent>
//                           </Tooltip>
//                         </TooltipProvider>
//                       ) : (
//                         user.username
//                       )}
//                     </TableCell>
//                     <TableCell className='p-4'>{user.email}</TableCell>
//                     <TableCell className='p-4'>{user.name || 'N/A'}</TableCell>
//                     {/* <TableCell className='p-4'>
//                       <Badge className={cn(statusClass(user.status), 'capitalize')}>
//                         {(user.status)?.toLowerCase()}
//                       </Badge>
//                     </TableCell> */}
//                     <TableCell className='p-4'>
//                       {isCurrentUser(user.email) ? (
//                         <Badge className='bg-primary text-primary-foreground'>me</Badge>
//                       ) : (
//                         <Button
//                           variant='destructive'
//                           size='icon'
//                           className='size-7 text-destructive bg-transparent hover:text-white dark:text-white hover:bg-destructive/60 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
//                           onClick={() => handleDelete(user.username, user.email)}
//                         >
//                           <Trash2 strokeWidth={2} />
//                         </Button>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </div>

//         {userToDelete && (
//           <UserDeleteDialog
//             open={deleteDialogOpen}
//             onOpenChange={setDeleteDialogOpen}
//             userName={userToDelete.username}
//             onDelete={confirmDelete}
//           />
//         )}

//         {inviteDialogOpen && (
//           <UserInviteDialog
//             open={inviteDialogOpen}
//             onOpenChange={setInviteDialogOpen}
//           />
//         )}
//       </div>
//     </div>
//   );
// }
