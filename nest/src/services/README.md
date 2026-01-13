# 服务目录 (Services)

服务目录包含应用的业务逻辑服务类，提供数据访问、缓存管理和其他核心功能服务。

## 📁 目录结构

```
services/
├── database.service.ts   # 数据库服务 - 原生SQL查询和连接管理
├── redis.service.ts      # Redis服务 - 缓存和会话管理
└── README.md            # 本文档
```

## 🎯 服务职责

### 1. 业务逻辑封装
- 核心业务逻辑实现
- 数据处理和转换
- 业务规则验证
- 复杂计算处理

### 2. 数据访问抽象
- 数据库操作封装
- 缓存操作管理
- 外部API调用
- 文件系统操作

### 3. 系统集成
- 第三方服务集成
- 消息队列处理
- 定时任务管理
- 系统监控和日志

### 4. 可复用组件
- 通用工具函数
- 配置管理
- 错误处理
- 性能优化

## 📋 服务详情

### DatabaseService (数据库服务)

**功能：** 提供原生SQL查询和数据库连接管理

**主要方法：**
- `testConnection()` - 测试数据库连接
- `query(sql, params)` - 执行原生SQL查询

**使用场景：**
- 复杂的SQL查询
- 数据库连接状态检查
- 性能优化的原生查询
- 数据库维护操作

**代码示例：**
```typescript
@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // 测试数据库连接
  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }

  // 执行原生SQL查询
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.dataSource.query(sql, params);
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw error;
    }
  }
}
```

### RedisService (Redis服务)

**功能：** 提供Redis缓存操作和会话管理

**主要方法：**
- `get(key)` - 获取缓存值
- `set(key, value, ttl)` - 设置缓存值
- `del(key)` - 删除缓存值

**生命周期钩子：**
- `onModuleInit()` - 模块初始化时连接Redis
- `onModuleDestroy()` - 模块销毁时断开连接

**使用场景：**
- 用户会话存储
- 临时数据缓存
- 分布式锁实现
- 消息队列处理

**代码示例：**
```typescript
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
```

## 🛠️ NestJS 服务概念

### 服务装饰器

#### @Injectable()
```typescript
@Injectable()  // 标记为可注入的服务
export class MyService {}
```

#### 依赖注入
```typescript
constructor(
  private readonly otherService: OtherService,
  @Inject('CONFIG_TOKEN') private config: ConfigType,
) {}
```

### 生命周期钩子

#### OnModuleInit
```typescript
export class MyService implements OnModuleInit {
  onModuleInit() {
    // 模块初始化时执行
  }
}
```

#### OnModuleDestroy
```typescript
export class MyService implements OnModuleDestroy {
  onModuleDestroy() {
    // 模块销毁时执行
  }
}
```

## 🔄 服务使用示例

### 在控制器中使用服务
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  @Get('database')
  async checkDatabase() {
    const isConnected = await this.databaseService.testConnection();
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }

  @Get('redis')
  async checkRedis() {
    const testKey = 'health_check';
    const testValue = Date.now().toString();
    
    const setResult = await this.redisService.set(testKey, testValue, 10);
    const getValue = await this.redisService.get(testKey);
    
    return {
      status: setResult && getValue === testValue ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }
}
```

### 在其他服务中使用
```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  async getUserStats(userId: number) {
    // 先从缓存获取
    const cacheKey = `user_stats_${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，查询数据库
    const stats = await this.databaseService.query(
      'SELECT COUNT(*) as login_count FROM user_tokens WHERE user_id = ?',
      [userId]
    );

    // 缓存结果（1小时）
    await this.redisService.set(cacheKey, JSON.stringify(stats), 3600);
    
    return stats;
  }
}
```

## 📊 服务架构模式

### 分层架构
```
Controller Layer (控制器层)
    ↓
Service Layer (服务层)
    ↓
Repository Layer (仓库层)
    ↓
Database Layer (数据库层)
```

### 依赖注入流程
```
Module Registration → Service Creation → Dependency Injection → Service Usage
```

## 🔧 配置管理

### 环境变量配置
```typescript
// 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=database_name

// Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 配置服务示例
```typescript
@Injectable()
export class ConfigService {
  get databaseConfig() {
    return {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'database',
    };
  }

  get redisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0'),
    };
  }
}
```

## 🧪 服务测试

### 单元测试示例
```typescript
describe('DatabaseService', () => {
  let service: DatabaseService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should test connection successfully', async () => {
    jest.spyOn(dataSource, 'query').mockResolvedValue([{ '1': 1 }]);

    const result = await service.testConnection();

    expect(result).toBe(true);
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('should handle connection failure', async () => {
    jest.spyOn(dataSource, 'query').mockRejectedValue(new Error('Connection failed'));

    const result = await service.testConnection();

    expect(result).toBe(false);
  });
});
```

### 集成测试示例
```typescript
describe('RedisService (Integration)', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should set and get value', async () => {
    const key = 'test_key';
    const value = 'test_value';

    const setResult = await service.set(key, value);
    const getValue = await service.get(key);

    expect(setResult).toBe(true);
    expect(getValue).toBe(value);
  });

  it('should handle TTL correctly', async () => {
    const key = 'ttl_test';
    const value = 'ttl_value';

    await service.set(key, value, 1); // 1秒过期
    
    const immediateValue = await service.get(key);
    expect(immediateValue).toBe(value);

    // 等待过期
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const expiredValue = await service.get(key);
    expect(expiredValue).toBeNull();
  });
});
```

## 🚀 最佳实践

### 1. 服务设计原则
- 单一职责原则
- 依赖注入优于硬编码
- 接口隔离原则
- 开闭原则

### 2. 错误处理
- 统一的错误处理策略
- 详细的错误日志记录
- 优雅的降级处理
- 用户友好的错误信息

### 3. 性能优化
- 合理使用缓存
- 异步操作优化
- 连接池管理
- 资源清理

### 4. 安全考虑
- 输入验证和清理
- 敏感信息保护
- 访问权限控制
- 审计日志记录

## 📈 监控和日志

### 日志记录
```typescript
@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  logInfo(message: string, context?: any) {
    this.logger.log(message, context);
  }

  logError(message: string, error?: Error, context?: any) {
    this.logger.error(message, error?.stack, context);
  }

  logWarning(message: string, context?: any) {
    this.logger.warn(message, context);
  }
}
```

### 性能监控
```typescript
@Injectable()
export class MetricsService {
  private readonly metrics = new Map<string, number>();

  recordExecutionTime(operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    this.metrics.set(`${operation}_duration`, duration);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

## 📚 相关文档

- [NestJS Providers 文档](https://docs.nestjs.com/providers)
- [TypeORM DataSource 文档](https://typeorm.io/data-source)
- [ioredis 文档](https://github.com/luin/ioredis)
- [依赖注入模式](https://martinfowler.com/articles/injection.html)