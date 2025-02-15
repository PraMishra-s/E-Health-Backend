import { InferSelectModel } from "drizzle-orm";
import { users } from "../database/schemas/users";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;  // For JWT session tracking
      user?: InferSelectModel<typeof users>; // Attach user details after authentication
    }
  }
}
