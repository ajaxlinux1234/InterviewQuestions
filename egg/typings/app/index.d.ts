import 'egg';
import { Redis } from 'ioredis';

declare module 'egg' {
  interface Application {
    mysql: {
      query(sql: string, params?: any[]): Promise<any>;
      get(table: string, where?: any): Promise<any>;
      select(table: string, options?: any): Promise<any>;
      insert(table: string, row: any): Promise<any>;
      update(table: string, row: any, options?: any): Promise<any>;
      delete(table: string, where?: any): Promise<any>;
    };
    redis: Redis;
  }
}