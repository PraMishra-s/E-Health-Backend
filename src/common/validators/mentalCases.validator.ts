import { z } from "zod";

export const updateMentalHealthCaseSchema = z.object({
  action_taken: z.string().min(1, 'Action taken is required'),
  is_resolved: z.boolean()
});