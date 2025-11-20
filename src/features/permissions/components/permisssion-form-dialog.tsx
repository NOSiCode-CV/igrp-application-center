// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   IGRPButtonPrimitive,
//   IGRPDialogContentPrimitive,
//   IGRPDialogFooterPrimitive,
//   IGRPDialogHeaderPrimitive,
//   IGRPDialogPrimitive,
//   IGRPDialogTitlePrimitive,
//   IGRPFormControlPrimitive,
//   IGRPFormDescriptionPrimitive,
//   IGRPFormFieldPrimitive,
//   IGRPFormItemPrimitive,
//   IGRPFormLabelPrimitive,
//   IGRPFormMessagePrimitive,
//   IGRPFormPrimitive,
//   IGRPInputPrimitive,
//   IGRPSelectContentPrimitive,
//   IGRPSelectItemPrimitive,
//   IGRPSelectPrimitive,
//   IGRPSelectTriggerPrimitive,
//   IGRPSelectValuePrimitive,
//   IGRPTextAreaPrimitive,
//   useIGRPToast,
// } from "@igrp/igrp-framework-react-design-system";
// import { useEffect } from "react";
// import { useForm } from "react-hook-form";

// import {
//   type CreatePermissionArgs,
//   normalizePermission,
//   type PermissionArgs,
//   permissionFormSchema,
//   permissionStatusSchema,
//   type UpdatePermissionArgs,
//   updatePermissionSchema,
// } from "@/features/permissions/permissions-schemas";
// import { STATUS_OPTIONS } from "@/lib/constants";

// interface PermissionCreateDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   departmentCode: string;
//   permission?: PermissionArgs;
// }

// export function PermissionFormDialog({
//   open,
//   onOpenChange,
//   departmentCode,
//   permission,
// }: PermissionCreateDialogProps) {
//   const { igrpToast } = useIGRPToast();

//   const { mutateAsync: createPermission, isPending: isCreating } =
//     useCreatePermission();
//   const { mutateAsync: updatePermission, isPending: isUpdating } =
//     useUpdatePermission();

//   const isEdit = !!permission;

//   const form = useForm<PermissionArgs>({
//     resolver: zodResolver(permissionFormSchema),
//     defaultValues: {
//       name: "",
//       description: "",
//       departmentCode: departmentCode,
//       status: permissionStatusSchema.enum.ACTIVE,
//     },
//   });

//   useEffect(() => {
//     if (!open) return;

//     if (permission) {
//       form.reset({
//         name: permission.name ?? "",
//         description: permission.description ?? null,
//         departmentCode: departmentCode ?? "",
//         status: permission.status || permissionStatusSchema.enum.ACTIVE,
//       } as PermissionArgs);
//     } else {
//       form.reset({
//         name: "",
//         description: "",
//         departmentCode,
//         status: permissionStatusSchema.enum.ACTIVE,
//       } as PermissionArgs);
//     }
//   }, [open, permission, departmentCode, form]);

//   const onSubmit = async (values: PermissionArgs) => {
//     try {
//       if (permission) {
//         const parsed = updatePermissionSchema.parse({
//           ...values,
//         } as UpdatePermissionArgs);

//         const payload = normalizePermission(parsed as PermissionArgs);

//         await updatePermission({ name: permission.name, data: payload });

//         igrpToast({
//           type: "success",
//           title: "Atualizar Permissão",
//           description: "Permissão foi atualizado com sucesso.",
//         });
//       } else {
//         const payload: CreatePermissionArgs = {
//           name: values.name,
//           description: values.description || "",
//           departmentCode: values.departmentCode,
//           status: values.status,
//         };

//         await createPermission(payload);

//         igrpToast({
//           type: "success",
//           title: "Permissão Criada",
//           description: "Permissão criada com sucesso.",
//         });
//       }
//     } catch (error) {
//       igrpToast({
//         type: "error",
//         title: "Não foi possível criar a permissão.",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Ocorreu um erro desconhecido.",
//       });
//     } finally {
//       form.reset();
//       onOpenChange(false);
//     }
//   };

//   return (
//     <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
//       <IGRPDialogContentPrimitive className="md:min-w-2xl">
//         <IGRPDialogHeaderPrimitive>
//           <IGRPDialogTitlePrimitive>
//             {isEdit ? "Editar Permissão" : "Adicionar Permissão"}
//           </IGRPDialogTitlePrimitive>
//         </IGRPDialogHeaderPrimitive>

//         <IGRPFormPrimitive {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className="flex flex-col gap-4"
//           >
//             <IGRPFormFieldPrimitive
//               control={form.control}
//               name="name"
//               render={({ field }) => (
//                 <IGRPFormItemPrimitive>
//                   <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
//                     Nome
//                   </IGRPFormLabelPrimitive>
//                   <IGRPFormControlPrimitive>
//                     <IGRPInputPrimitive
//                       placeholder="Identificador único do permissão"
//                       required
//                       className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
//                       disabled={isEdit}
//                       {...field}
//                     />
//                   </IGRPFormControlPrimitive>
//                   <IGRPFormDescriptionPrimitive>
//                     Apenas são permitidas letras minúsculas, números, underscore
//                     (_) e hífen (-).
//                   </IGRPFormDescriptionPrimitive>
//                   <IGRPFormMessagePrimitive />
//                 </IGRPFormItemPrimitive>
//               )}
//             />

//             <IGRPFormFieldPrimitive
//               control={form.control}
//               name="description"
//               render={({ field }) => (
//                 <IGRPFormItemPrimitive>
//                   <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
//                     Descrição
//                   </IGRPFormLabelPrimitive>
//                   <IGRPFormControlPrimitive>
//                     <IGRPTextAreaPrimitive
//                       placeholder="Breve descrição do perfil"
//                       required
//                       className="resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
//                       rows={2}
//                       value={field.value ?? ""}
//                       onChange={field.onChange}
//                       onBlur={field.onBlur}
//                       name={field.name}
//                       ref={field.ref}
//                     />
//                   </IGRPFormControlPrimitive>
//                   <IGRPFormMessagePrimitive />
//                 </IGRPFormItemPrimitive>
//               )}
//             />

//             <IGRPFormFieldPrimitive
//               control={form.control}
//               name="status"
//               render={({ field }) => (
//                 <IGRPFormItemPrimitive>
//                   <IGRPFormLabelPrimitive>Estado</IGRPFormLabelPrimitive>
//                   <IGRPSelectPrimitive
//                     onValueChange={field.onChange}
//                     value={field.value}
//                   >
//                     <IGRPFormControlPrimitive>
//                       <IGRPSelectTriggerPrimitive className="w-full truncate">
//                         <IGRPSelectValuePrimitive placeholder="Selecionar estado" />
//                       </IGRPSelectTriggerPrimitive>
//                     </IGRPFormControlPrimitive>
//                     <IGRPSelectContentPrimitive>
//                       {STATUS_OPTIONS.map((status) => (
//                         <IGRPSelectItemPrimitive
//                           key={status.value}
//                           value={status.value}
//                         >
//                           {status.label}
//                         </IGRPSelectItemPrimitive>
//                       ))}
//                     </IGRPSelectContentPrimitive>
//                   </IGRPSelectPrimitive>
//                   <IGRPFormMessagePrimitive />
//                 </IGRPFormItemPrimitive>
//               )}
//             />

//             <IGRPDialogFooterPrimitive className="pt-4">
//               <IGRPButtonPrimitive
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//               >
//                 Cancelar
//               </IGRPButtonPrimitive>
//               <IGRPButtonPrimitive
//                 type="submit"
//                 disabled={isCreating || isUpdating}
//               >
//                 {isEdit
//                   ? isUpdating
//                     ? "Atualizando..."
//                     : "Atualizar"
//                   : isCreating
//                     ? "Guardando..."
//                     : "Adicionar"}
//               </IGRPButtonPrimitive>
//             </IGRPDialogFooterPrimitive>
//           </form>
//         </IGRPFormPrimitive>
//       </IGRPDialogContentPrimitive>
//     </IGRPDialogPrimitive>
//   );
// }
