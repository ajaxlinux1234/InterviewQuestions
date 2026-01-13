import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
      family: 4,
    });

    this.client.on('connect', () => {
      console.log('✅ Redis 连接成功');
    });

    this.client.on('error', (err) => {
      console.log('⚠️  Redis 连接失败:', err.message);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET 失败:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET 失败:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL 失败:', error);
      return false;
    }
  }
}