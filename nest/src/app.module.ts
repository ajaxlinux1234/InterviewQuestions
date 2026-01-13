/**
 * NestJS 应用根模块 (app.module.ts)
 * 
 * 这是 NestJS 应用的根模块，负责：
 * 1. 配置数据库连接 (TypeORM + MySQL)
 * 2. 导入其他功能模块
 * 3. 注册控制器和服务提供者
 * 4. 管理应用的整体架构
 * 
 * NestJS 核心概念：
 * - @Module(): 模块装饰器，定义模块的元数据
 * - imports: 导入其他模块
 * - controllers: 注册控制器（处理 HTTP 请求）
 * - providers: 注册服务提供者（业务逻辑、数据访问等）
 * - TypeORM: 对象关系映射 (ORM) 库，用于数据库操作
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './controllers/home.controller';
import { UserController, PushController } from './controllers/user.controller';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { UserToken } from './entities/user-token.entity';

/**
 * 应用根模块
 * 
 * @Module 装饰器配置：
 * - imports: 导入的模块列表
 * - controllers: 控制器列表（处理 HTTP 请求）
 * - providers: 服务提供者列表（依赖注入容器中的服务）
 */
@Module({
  imports: [
    // TypeORM 数据库配置
    // TypeORM 是 TypeScript 的 ORM 库，支持多种数据库
    TypeOrmModule.forRoot({
      type: 'mysql',                                          // 数据库类型
      host: process.env.MYSQL_HOST || 'localhost',           // 数据库主机
      port: parseInt(process.env.MYSQL_PORT || '3306'),      // 数据库端口
      username: process.env.MYSQL_USER || 'root',            // 数据库用户名
      password: process.env.MYSQL_PASSWORD || '',            // 数据库密码
      database: process.env.MYSQL_DATABASE || 'im_service',  // 数据库名称
      entities: [User, UserToken],                           // 实体类列表（对应数据库表）
      synchronize: false,                                    // 是否自动同步数据库结构（生产环境应设为 false）
      extra: {
        connectionLimit: 5,    // 连接池最大连接数
        acquireTimeout: 30000, // 获取连接超时时间（毫秒）
        timeout: 30000,        // 查询超时时间（毫秒）
      },
    }),
    
    // 认证模块 - 处理用户登录、注册、权限验证等
    AuthModule,
  ],
  
  // 控制器列表
  // 控制器负责处理传入的 HTTP 请求并返回响应
  controllers: [
    HomeController,   // 首页控制器
    UserController,   // 用户信息控制器
    PushController,   // HTTP/2 服务器推送演示控制器
  ],
  
  // 服务提供者列表
  // 这些服务会被注入到依赖注入容器中，可以在其他地方使用
  providers: [
    DatabaseService,  // 数据库服务（原生 SQL 查询）
    RedisService,     // Redis 缓存服务
  ],
})
export class AppModule {
  /**
   * 模块类通常是空的，所有配置都通过 @Module 装饰器完成
   * 
   * NestJS 模块系统特点：
   * 1. 模块化架构：每个功能都可以封装成独立的模块
   * 2. 依赖注入：自动管理服务之间的依赖关系
   * 3. 装饰器驱动：使用装饰器来定义模块、控制器、服务等
   * 4. 可扩展性：易于添加新功能和集成第三方库
   */
}