

import { getEnv } from "../common/utils/get-env";

export const redisConfig = {
  url: getEnv("REDIS_URL", "REDIS_URL"), 
  token: getEnv("REDIS_TOKEN", "REDIS_TOKEN"),
};
