import { InferSelectModel } from "drizzle-orm";
import { users } from "../database/schemas/users";
import { Request } from "express";

export type User = InferSelectModel<typeof users>;
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;  
      user?: User ; 
    }
  }
}
