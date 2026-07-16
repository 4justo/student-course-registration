import { z } from 'zod';

const emailField = z.string().trim().toLowerCase().email('Enter a valid email address');
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must not exceed 64 characters');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  reg_no: z
    .string()
    .trim()
    .min(2, 'Registration number must be at least 2 characters')
    .max(50, 'Registration number must not exceed 50 characters'),
  email: emailField,
  password: passwordField,
  gender: z.string().trim().max(20).optional(),
});

export const registerAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  email: emailField,
  password: passwordField,
  gender: z.string().trim().max(20).optional(),
  admin_code: z.string().min(1, 'Admin code is required'),
});
