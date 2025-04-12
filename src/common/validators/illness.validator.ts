import { z } from "zod";


export const illnessSchema = z.object({
    name: z.string().trim().min(3).max(100),
    type: z.enum(["COMMUNICABLE", "NON_COMMUNICABLE"]),
    description: z.string().trim().max(500).optional(),
    category_id: z.string().uuid().optional(),
});
export const updateIllnessSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["COMMUNICABLE", "NON_COMMUNICABLE"]).optional(),
  description: z.string().min(1).optional(),
  category_id: z.string().uuid().optional(),
});

export const createIllnessCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const updateIllnessCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
});

