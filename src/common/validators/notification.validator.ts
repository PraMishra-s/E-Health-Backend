import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  userType: z.enum(["STUDENT", "STAFF", "HA", "DEAN"]),
});
