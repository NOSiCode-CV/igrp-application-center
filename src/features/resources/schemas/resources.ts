import { z } from 'zod';

export const resourceItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  permissionId: z.number().min(1, 'Permission ID is required'),
});

export const resourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required'),
  type: z.enum(['API', 'PAGE', 'COMPONENT'], {
    required_error: 'Resource type is required',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  applicationId: z.number().min(1, 'Application ID is required'),
  items: z.array(resourceItemSchema).optional().default([]),
  externalId: z.string().optional(),
});

export const createResourceSchema = resourceSchema;
export const updateResourceSchema = resourceSchema.partial().omit({ applicationId: true });

export type ResourceFormData = z.infer<typeof resourceSchema>;
export type CreateResourceFormData = z.infer<typeof createResourceSchema>;
export type UpdateResourceFormData = z.infer<typeof updateResourceSchema>;
