import { z } from 'zod';

export const createRegistrationSchema = z.object({
  course_id: z.coerce.number().int().positive(),
  student_id: z.coerce.number().int().positive(),
});
