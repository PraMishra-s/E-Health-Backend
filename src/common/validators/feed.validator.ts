import { z } from "zod";

export const feedSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(5, "Description must be at least 500 characters").max(500, "Description must be less than 500 characters"),
  image_urls: z.array(z.string().url("Invalid image URL")).optional(),
  video_url: z.array(z.string().url("Invalid video URL")).optional(),  
});
