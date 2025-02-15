
import redis from "../service/redis.service";


export const setKeyWithTTL = async (key: string, value: string, ttlInSeconds: number) => {
  return await redis.set(key, value, { ex: ttlInSeconds });
};

export const getKey = async (key: string) => {
  return await redis.get(key);
};

export const deleteKey = async (key: string) => {
  return await redis.del(key);
};
