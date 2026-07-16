import { z } from 'zod';

export const createStudentSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  reg_no: z.string().trim().min(3).max(50).optional(),
});
