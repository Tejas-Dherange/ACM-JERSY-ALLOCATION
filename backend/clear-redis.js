const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

redis.flushall()
  .then(() => {
    console.log('✅ Redis cleared successfully!');
    redis.quit();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error clearing Redis:', err);
    redis.quit();
    process.exit(1);
  });
