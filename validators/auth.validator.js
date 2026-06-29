import { z } from 'zod';

export const loginSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, 'Registration number is required')
    .regex(/^[A-Za-z0-9\-]+$/, 'Registration number format is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(64, 'Password must not exceed 64 characters'),
});
