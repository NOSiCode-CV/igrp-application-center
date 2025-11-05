import { z } from "zod";
import { statusSchema } from "../../schemas/global";

const NameSchema = z
  .string()
  .trim()
  .min(3, "Nome deve ter mínimo 3 caracteres")
  .max(120);

const UsernameSchema = z
  .string()
  .trim()
  .min(3, "Username deve ter mínimo 3 caracteres")
  .max(50);

const EmailSchema = z.email({ message: "Email inválido" }).max(254);

export const UserSchema = z.object({
  id: z.number().int().positive().optional(),
  name: NameSchema,
  username: UsernameSchema,
  email: EmailSchema,
  status: statusSchema,
  picture: z.string().optional(),
  signature: z.string().optional(),
});

export const CreateUserSchema = UserSchema.omit({ id: true });
export const UpdateUserSchema = UserSchema.omit({
  id: true,
  username: true,
}).partial();

export type UserArgs = z.infer<typeof UserSchema>;
export type CreateUserArgs = z.infer<typeof CreateUserSchema>;
export type UpdateUserArgs = z.infer<typeof UpdateUserSchema>;

export const FormUserSchema = z.object({
  name: NameSchema,
  username: UsernameSchema.optional(),
  email: EmailSchema,
});

export type FormUserArgs = z.infer<typeof FormUserSchema>;

export const formSchema = z.object({
  users: z
    .array(FormUserSchema)
    .min(1, { message: "Adicionar pelo menos um utilizador" }),
  departmentCode: z.string().optional(),
  roleNames: z.array(z.string()).optional(),
});

export type FormSchema = z.infer<typeof formSchema>;
