import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not set in environment variables');
}

export const redis = createClient({ url: redisUrl });

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Only connect if not already connected
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
} 