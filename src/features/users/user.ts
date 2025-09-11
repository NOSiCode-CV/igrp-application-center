import { z } from 'zod';

export const userSchema = z.object({
  igrpUsername: z.string(),
  fullname: z.string().nullable().optional(),
  email: z.string().email(),
  roles: z.array(z.string()).optional(),
  departments: z.array(z.string()).optional(),
  apps: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  signature: z.any().optional().nullable(),
  picture: z.any().optional().nullable(),
  image: z.any().optional().nullable(),
});

export const emailSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

export const formSchema = z.object({
  emails: z.array(emailSchema).min(1, {
    message: 'You must add at least one email address.',
  }),
  applicationId: z.string().optional(),
  departmentId: z.string().optional(),
  roleId: z.string(),
});

export type User = z.infer<typeof userSchema>;
