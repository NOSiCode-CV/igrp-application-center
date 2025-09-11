import { z } from 'zod';

export const fileMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
});

export const fileWithPreviewSchema = z.object({
  id: z.string(),
  file: z.union([z.instanceof(File), fileMetadataSchema]), // REQUIRED
  preview: z.string().optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type FileWithPreview = z.infer<typeof fileWithPreviewSchema>;
