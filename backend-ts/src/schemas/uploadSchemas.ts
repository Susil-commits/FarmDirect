import { z } from 'zod';

export const presignUploadSchema = z.object({
  folder: z.string().trim().min(1).max(50).default('general'),
});
