import { InferSelectModel } from "drizzle-orm";
import { users } from "../database/schemas/users";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;  
      user?: InferSelectModel<typeof users> | null; // Ensure it's always defined
    }
  }
}
