// src/services/redis.service.ts
import { Redis } from '@upstash/redis';
import { redisConfig } from '../../config/redis.config';


const redis = new Redis({
  url: redisConfig.url,
  token: redisConfig.token,
});

export default redis;
