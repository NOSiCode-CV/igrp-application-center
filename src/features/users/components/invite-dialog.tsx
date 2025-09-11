// 'use client';

// import { useEffect, useState } from 'react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useFieldArray, useForm } from 'react-hook-form';
// import * as z from 'zod';
// import {
//   IGRPButtonPrimitive,
//   IGRPCardPrimitives,
//   IGRPCardContentPrimitives,
// } from '@igrp/igrp-framework-react-design-system';
// import {
//   IGRPCommandPrimitive,
//   IGRPCommandEmptyPrimitive,
//   IGRPCommandGroupPrimitive,
//   IGRPCommandInputPrimitive,
//   IGRPCommandItemPrimitive,
//   IGRPCommandListPrimitive,
// } from '@igrp/igrp-framework-react-design-system';

// import {
//   IGRPDialogPrimitive,
//   IGRPDialogContentPrimitive,
//   IGRPDialogDescriptionPrimitive,
//   IGRPDialogFooterPrimitive,
//   IGRPDialogHeaderPrimitive,
//   IGRPDialogTitlePrimitive,
// } from '@igrp/igrp-framework-react-design-system';
// import {
//   IGRPFormPrimitive,
//   IGRPFormControlPrimitive,
//   IGRPFormFieldPrimitive,
//   IGRPFormItemPrimitive,
//   IGRPFormLabelPrimitive,
//   IGRPFormMessagePrimitive,
// } from '@igrp/igrp-framework-react-design-system';

// import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
// import {
//   IGRPPopoverPrimitive,
//   IGRPPopoverContentPrimitive,
// } from '@igrp/igrp-framework-react-design-system';
// import { IGRPSeparatorPrimitive } from '@igrp/igrp-framework-react-design-system';
// import { useApps, useDepartments, useInviteUser, useRoles } from '@/features/users/use-users';
// import { formSchema } from '@/features/users/user';
// import { cn } from '@/lib/utils';

// interface UserInviteDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// // TODO: messages

// export function UserInviteDialog({ open, onOpenChange }: UserInviteDialogProps) {
//   const [openApps, setOpenApps] = useState(false);
//   const [openDepts, setOpenDepts] = useState(false);
//   const [openRoles, setOpenRoles] = useState(false);

//   const { mutateAsync: userInvite } = useInviteUser();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       emails: [{ email: '' }],
//       applicationId: undefined,
//       departmentId: undefined,
//       roleId: '',
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control: form.control,
//     name: 'emails',
//   });

//   useEffect(() => {
//     if (open) {
//       form.reset({
//         emails: [{ email: '' }],
//         applicationId: undefined,
//         departmentId: undefined,
//         roleId: '',
//       });
//     }
//   }, [open, form]);

//   const selectedAppId = form.watch('applicationId');
//   const selectedDeptId = form.watch('departmentId');

//   const { data: apps, isLoading: appsLoading, error: appsError } = useApps();
//   const {
//     data: depts = [],
//     isLoading: deptLoading,
//     error: deptError,
//   } = useDepartments(selectedAppId);
//   const { data: roles = [], isLoading: rolesLoading } = useRoles(selectedAppId, selectedDeptId);

//   const isLoading = appsLoading || !apps;
//   if (isLoading) return <div>Loading Apps...</div>;
//   if (appsError) throw appsError;

//   const isValid = form.formState.isValid;
//   const isSubmitting = form.formState.isSubmitting;
//   const btnDisabled = !isValid || isSubmitting || isLoading;

//   const onSubmit = async (data: z.infer<typeof formSchema>) => {
//     const { emails, applicationId, departmentId, roleId } = data;
//     const inviteAll = Promise.all(
//       emails.map(({ email }) =>
//         userInvite({
//           email,
//           appCode: applicationId,
//           departmentCode: departmentId,
//           roles: roleId,
//         }),
//       ),
//     );

//     toast.promise(inviteAll, {
//       loading: `Inviting ${emails.length} user${emails.length > 1 ? 's' : ''}...`,
//       success: `Successfully invited ${emails.length} user${emails.length > 1 ? 's' : ''}!`,
//       error: (err) => `Failed to invite user${emails.length > 1 ? 's' : ''}: ${err.message}`,
//     });

//     try {
//       await inviteAll;
//       form.reset();
//       onOpenChange(false);
//     } catch (error) {
//       console.warn(error);
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={onOpenChange}
//     >
//       <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
//         <DialogHeader>
//           <DialogTitle>Invite Users</DialogTitle>
//           <DialogDescription>
//             Send invitation emails to new users. All users will be assigned to the same application,
//             department, and roles.
//           </DialogDescription>
//         </DialogHeader>
//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className='space-y-6'
//           >
//             <div className='space-y-4'>
//               <Card>
//                 <CardContent className='space-y-4'>
//                   <h3 className='text-sm font-medium'>Email Addresses</h3>
//                   <p className='text-sm text-muted-foreground mb-4'>
//                     Add email addresses for users you want to invite. All users will receive the
//                     same permissions.
//                   </p>

//                   {fields.map((field, index) => (
//                     <div
//                       key={field.id}
//                       className='flex gap-2'
//                     >
//                       <FormField
//                         control={form.control}
//                         name={`emails.${index}.email`}
//                         render={({ field }) => (
//                           <FormItem className='flex-1'>
//                             <FormControl>
//                               <Input
//                                 placeholder='user@example.com'
//                                 {...field}
//                               />
//                             </FormControl>
//                             <FormMessage />
//                           </FormItem>
//                         )}
//                       />
//                       <Button
//                         type='button'
//                         variant='outline'
//                         size='icon'
//                         onClick={() => remove(index)}
//                         disabled={fields.length === 1}
//                         className='hover:text-destructive hover:border-destructive'
//                       >
//                         <Trash2 strokeWidth={2} />
//                         <span className='sr-only'>Remove</span>
//                       </Button>
//                     </div>
//                   ))}

//                   <Button
//                     type='button'
//                     variant='outline'
//                     size='sm'
//                     onClick={async () => {
//                       const lastIndex = fields.length - 1;
//                       const isValid = await form.trigger(`emails.${lastIndex}.email`);
//                       if (isValid) {
//                         append({ email: '' });
//                       } else {
//                         toast.warning('Please enter a valid email before adding another.');
//                       }
//                     }}
//                     className='mt-2'
//                   >
//                     <CirclePlus
//                       className='text-primary'
//                       strokeWidth={2}
//                     />
//                     Add Another Email
//                   </Button>
//                 </CardContent>
//               </Card>

//               <Separator />

//               <Card>
//                 <CardContent className='space-y-4'>
//                   <h3 className='text-sm font-medium'>Permissions</h3>
//                   <p className='text-sm text-muted-foreground mb-4'>
//                     Select the application, department, and roles for all invited users.
//                   </p>

//                   <FormField
//                     control={form.control}
//                     name='applicationId'
//                     render={({ field }) => (
//                       <FormItem className='flex flex-col'>
//                         <FormLabel>Application</FormLabel>
//                         <Popover
//                           open={openApps}
//                           onOpenChange={setOpenApps}
//                         >
//                           <PopoverTrigger asChild>
//                             <FormControl>
//                               <Button
//                                 variant='outline'
//                                 role='combobox'
//                                 className={cn(
//                                   'w-full justify-between',
//                                   !field.value && 'text-muted-foreground',
//                                 )}
//                               >
//                                 {field.value
//                                   ? apps.find((app) => app.value === field.value)?.value
//                                   : 'Select application'}
//                                 <ChevronsUpDown
//                                   className='ml-2 shrink-0 opacity-50'
//                                   strokeWidth={2}
//                                 />
//                               </Button>
//                             </FormControl>
//                           </PopoverTrigger>
//                           <PopoverContent
//                             className='w-[--radix-popover-trigger-width] p-0'
//                             align='start'
//                           >
//                             <Command>
//                               <CommandInput placeholder='Search application...' />
//                               <CommandList>
//                                 <CommandEmpty>No application found.</CommandEmpty>
//                                 <CommandGroup>
//                                   {apps.map((app, index) => (
//                                     <CommandItem
//                                       value={app.value}
//                                       key={index}
//                                       onSelect={() => {
//                                         form.setValue('applicationId', app.value);
//                                         // Clear department and roles when application changes
//                                         form.setValue('departmentId', undefined);
//                                         form.setValue('roleId', '');
//                                         setOpenApps(false);
//                                       }}
//                                     >
//                                       <Check
//                                         strokeWidth={2}
//                                         className={cn(
//                                           'mr-2 h-4 w-4 opacity-0',
//                                           app.value === field.value && 'opacity-100',
//                                         )}
//                                       />
//                                       {app.label}
//                                     </CommandItem>
//                                   ))}
//                                 </CommandGroup>
//                               </CommandList>
//                             </Command>
//                           </PopoverContent>
//                         </Popover>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name='departmentId'
//                     render={({ field }) => {
//                       const isDeptDisabled =
//                         !selectedAppId || deptLoading || !!deptError || depts.length === 0;

//                       return (
//                         <FormItem className='flex flex-col'>
//                           <FormLabel>Department</FormLabel>
//                           <Popover
//                             open={openDepts}
//                             onOpenChange={setOpenDepts}
//                           >
//                             <PopoverTrigger asChild>
//                               <FormControl>
//                                 <Button
//                                   variant='outline'
//                                   role='combobox'
//                                   disabled={isDeptDisabled}
//                                   className={cn(
//                                     'w-full justify-between',
//                                     !field.value && 'text-muted-foreground',
//                                   )}
//                                 >
//                                   {deptLoading ? (
//                                     <span className='flex items-center gap-2'>
//                                       <Loader2
//                                         className='animate-spin h-4 w-4 mr-2'
//                                         strokeWidth={2}
//                                       />
//                                       Loading departments...
//                                     </span>
//                                   ) : field.value ? (
//                                     depts.find((dept) => dept.code === field.value)?.departmentName
//                                   ) : deptError ? (
//                                     'Error loading departments'
//                                   ) : isDeptDisabled ? (
//                                     'Select an application first'
//                                   ) : (
//                                     'Select department'
//                                   )}
//                                   {!deptLoading && (
//                                     <ChevronsUpDown
//                                       className='ml-2 h-4 w-4 shrink-0 opacity-50'
//                                       strokeWidth={2}
//                                     />
//                                   )}
//                                 </Button>
//                               </FormControl>
//                             </PopoverTrigger>
//                             <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
//                               <Command>
//                                 <CommandInput placeholder='Search department...' />
//                                 <CommandList>
//                                   <CommandEmpty>No department found.</CommandEmpty>
//                                   <CommandGroup>
//                                     {depts.map((dept) => (
//                                       <CommandItem
//                                         value={dept.code}
//                                         key={dept.departmentName}
//                                         onSelect={() => {
//                                           form.setValue('departmentId', dept.code);
//                                           form.setValue('roleId', '');
//                                           setOpenDepts(false);
//                                         }}
//                                       >
//                                         <Check
//                                           className={cn(
//                                             'mr-2 h-4 w-4',
//                                             dept.code === field.value ? 'opacity-100' : 'opacity-0',
//                                           )}
//                                         />
//                                         {dept.departmentName}
//                                       </CommandItem>
//                                     ))}
//                                   </CommandGroup>
//                                 </CommandList>
//                               </Command>
//                             </PopoverContent>
//                           </Popover>
//                           <FormMessage>{deptError ? deptError.message : null}</FormMessage>
//                         </FormItem>
//                       );
//                     }}
//                   />

//                   <FormField
//                     control={form.control}
//                     name='roleId'
//                     render={({ field }) => {
//                       const isDisabled = !selectedDeptId || roles.length === 0;

//                       // Find the selected role name
//                       const selectedRole = field.value
//                         ? roles.find((r) => r === field.value)
//                         : null;

//                       return (
//                         <FormItem className='flex flex-col'>
//                           <FormLabel>Role</FormLabel>
//                           <Popover
//                             open={openRoles}
//                             onOpenChange={setOpenRoles}
//                           >
//                             <PopoverTrigger asChild>
//                               <FormControl>
//                                 <Button
//                                   variant='outline'
//                                   role='combobox'
//                                   disabled={isDisabled}
//                                   className={cn(
//                                     'w-full justify-between',
//                                     !field.value && 'text-muted-foreground',
//                                   )}
//                                 >
//                                   {rolesLoading ? (
//                                     <span className='flex items-center gap-2'>
//                                       <Loader2 className='animate-spin h-4 w-4' />
//                                       Loading roles...
//                                     </span>
//                                   ) : field.value ? (
//                                     selectedRole
//                                   ) : isDisabled ? (
//                                     'Select a department first'
//                                   ) : (
//                                     'Select a role'
//                                   )}
//                                   <ChevronsUpDown
//                                     className='ml-2 shrink-0 opacity-50'
//                                     strokeWidth={2}
//                                   />
//                                 </Button>
//                               </FormControl>
//                             </PopoverTrigger>
//                             <PopoverContent
//                               className='w-[--radix-popover-trigger-width] p-0'
//                               align='start'
//                             >
//                               <Command>
//                                 <CommandInput placeholder='Search roles...' />
//                                 <CommandList>
//                                   <CommandEmpty>No roles found.</CommandEmpty>
//                                   <CommandGroup>
//                                     {roles.map((role) => (
//                                       <CommandItem
//                                         value={role}
//                                         key={role}
//                                         onSelect={() => {
//                                           // Simply set the value to the selected role
//                                           form.setValue('roleId', role);
//                                           setOpenRoles(false);
//                                         }}
//                                       >
//                                         <Check
//                                           className={cn(
//                                             'mr-2 h-4 w-4',
//                                             field.value === role ? 'opacity-100' : 'opacity-0',
//                                           )}
//                                         />
//                                         {role}
//                                       </CommandItem>
//                                     ))}
//                                   </CommandGroup>
//                                 </CommandList>
//                               </Command>
//                             </PopoverContent>
//                           </Popover>
//                           <FormMessage />
//                         </FormItem>
//                       );
//                     }}
//                   />
//                 </CardContent>
//               </Card>
//             </div>

//             <DialogFooter>
//               <Button
//                 variant='outline'
//                 onClick={() => onOpenChange(false)}
//                 disabled={isLoading}
//                 type='button'
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type='submit'
//                 disabled={btnDisabled}
//               >
//                 {isLoading ? 'Sending Invitations...' : 'Send Invitations'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }
