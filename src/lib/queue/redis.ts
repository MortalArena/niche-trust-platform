import IORedis from 'ioredis';

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!connection) {
    connection = new IORedis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }

  return connection;
}
