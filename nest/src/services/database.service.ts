import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.dataSource.query(sql, params);
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw error;
    }
  }
}