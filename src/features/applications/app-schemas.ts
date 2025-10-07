import { z } from 'zod';
import { APPLICATIONS_TYPES_EXCLUDE } from './app-utils';
import { fileWithPreviewSchema } from '@/features/files/files-schema';
import { statusSchema } from '@/schemas/global';

export const appTypeCrud = z.enum(APPLICATIONS_TYPES_EXCLUDE);

export const applicationSchema = z
  .object({
    owner: z.string().min(3, 'Proprietário é obrigatório'),
    name: z.string().min(3, 'Nome é obrigatório'),
    code: z
      .string()
      .regex(/^[A-Z0-9_]+$/, 'O código deve conter apenas letras, números e sublinhados')
      .min(3, 'Código é obrigatório'),
    type: appTypeCrud,
    slug: z.string().optional(),
    url: z.string().optional(),
    description: z.string().min(5, 'Descrição é obrigatória'),
    status: statusSchema,
    departments: z.array(z.string()).min(1, 'Departamento é obrigatório'),
    picture: z.string().optional(),
    image: fileWithPreviewSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === appTypeCrud.enum.INTERNAL && !data.slug) {
      ctx.addIssue({
        path: ['slug'],
        code: z.ZodIssueCode.custom,
        message: 'URL Relativo é obrigatório',
      });
    }

    if (data.type === appTypeCrud.enum.EXTERNAL) {
      if (!data.url) {
        ctx.addIssue({
          path: ['url'],
          code: z.ZodIssueCode.custom,
          message: 'URL é obrigatório',
        });
      } else {
        try {
          new URL(data.url);
        } catch {
          ctx.addIssue({
            path: ['url'],
            code: z.ZodIssueCode.custom,
            message: 'URL inválida',
          });
        }
      }
    }
  });

export type ApplicationArgs = z.infer<typeof applicationSchema>;
