import rateLimit from "express-rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { Request, Response, NextFunction, RequestHandler } from "express";
import redis from "../common/service/redis.service";
import { HTTPSTATUS } from "../config/http.config";

const redisLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(2, "60s"),
  analytics: true,
});

const memoryLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 2, 
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const rateLimiter: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success } = await redisLimiter.limit(req.ip!);
    if (!success) {
      res.status(HTTPSTATUS.TOO_MANY_REQUESTS).json({ message: "Too many requests, slow down!" });
      return; 
    }
  } catch (error) {
    console.error("Upstash rate limiter failed, switching to in-memory fallback.");
    memoryLimiter(req, res, next);
    return; 
  }
  next();
};
