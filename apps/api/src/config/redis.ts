import Redis from 'ioredis';
import { env } from './env.js';

let redis: any = null;

try {
  // If we are in dev and docker is down, this won't crash the server.
  // Setting maxRetriesPerRequest to 0 and retryStrategy to null stops all retries.
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 0,
    retryStrategy: () => null, 
    lazyConnect: true,
  });

  redis.on('error', () => {
    // Suppress error logs to prevent console spam when Redis is down
  });

} catch {
  redis = null;
}

export { redis };
