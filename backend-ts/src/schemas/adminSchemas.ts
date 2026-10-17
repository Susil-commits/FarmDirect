import { z } from 'zod';
import { UserRole } from '../types/enums.js';

export const labelOrderAnomalySchema = z.object({
  label: z.enum(['confirmed', 'dismissed']),
  notes: z.string().optional(),
});

export const changeUserRoleSchema = z.object({
  newRole: z.nativeEnum(UserRole),
});

export const rejectUserKycSchema = z.object({
  reason: z.string().min(10, 'A rejection reason of at least 10 characters is required'),
});

export const sendAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  targetRole: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
}).passthrough();
