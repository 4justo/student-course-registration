import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  abbreviation: z.string().trim().min(2, 'Course code must be at least 2 characters').max(20),
  category: z.string().trim().max(100).optional(),
  instructor: z.string().trim().max(150).optional(),
  schedule: z.string().trim().max(150).optional(),
  credits: z.coerce.number().int().min(0).max(12).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  description: z.string().trim().max(4000).optional(),
  prereqs: z.array(z.string().trim()).optional(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').max(2000),
});
