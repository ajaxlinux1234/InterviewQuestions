# 实体目录 (Entities)

实体目录包含数据库实体类，定义了数据模型和数据库表的映射关系，使用 TypeORM 进行对象关系映射。

## 📁 目录结构

```
entities/
├── user.entity.ts        # 用户实体 - 用户基本信息表
├── user-token.entity.ts  # 用户令牌实体 - 访问令牌管理表
└── README.md             # 本文档
```

## 🎯 实体职责

### 1. 数据模型定义
- 定义数据库表结构
- 指定字段类型和约束
- 建立表之间的关系
- 提供类型安全的数据访问

### 2. ORM 映射
- 类到表的映射
- 属性到字段的映射
- 关系映射配置
- 索引和约束定义

### 3. 数据验证
- 字段长度限制
- 唯一性约束
- 非空约束
- 数据类型验证

### 4. 关系管理
- 一对一关系
- 一对多关系
- 多对多关系
- 级联操作配置

## 📋 实体详情

### User Entity (用户实体)

**表名：** `users`

**功能：** 存储用户基本信息

**字段结构：**
```typescript
{
  id: number;              // 主键，自增
  username: string;        // 用户名，唯一
  password: string;        // 密码哈希
  email: string;           // 邮箱，唯一
  last_seen?: Date;        // 最后在线时间
  created_at: Date;        // 创建时间
  updated_at: Date;        // 更新时间
  tokens: UserToken[];     // 关联的令牌列表
}
```

**数据库表结构：**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (username)
- UNIQUE KEY (email)

### UserToken Entity (用户令牌实体)

**表名：** `user_tokens`

**功能：** 管理用户访问令牌

**字段结构：**
```typescript
{
  id: number;              // 主键，自增
  user_id: number;         // 用户ID，外键
  token: string;           // 令牌字符串，唯一
  token_type: string;      // 令牌类型
  expires_at: Date;        // 过期时间
  is_revoked: number;      // 撤销状态
  created_at: Date;        // 创建时间
  last_used_at?: Date;     // 最后使用时间
  user_agent?: string;     // 用户代理
  ip_address?: string;     // IP地址
  user: User;              // 关联的用户
}
```

**数据库表结构：**
```sql
CREATE TABLE user_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  token_type VARCHAR(20) DEFAULT 'access',
  expires_at TIMESTAMP NOT NULL,
  is_revoked TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  user_agent VARCHAR(500) NULL,
  ip_address VARCHAR(45) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY (token)
- INDEX (user_id)
- INDEX (expires_at)

## 🛠️ TypeORM 装饰器

### 实体装饰器

#### @Entity()
```typescript
@Entity('table_name')  // 指定表名
export class EntityName {}
```

#### @Column()
```typescript
@Column()                           // 基本字段
@Column({ length: 100 })           // 指定长度
@Column({ unique: true })          // 唯一约束
@Column({ nullable: true })        // 允许为空
@Column({ default: 'value' })      // 默认值
@Column({ name: 'field_name' })    // 指定字段名
@Column({ type: 'varchar' })       // 指定类型
```

#### @PrimaryGeneratedColumn()
```typescript
@PrimaryGeneratedColumn()          // 自增主键
@PrimaryGeneratedColumn('uuid')    // UUID主键
```

#### 时间字段装饰器
```typescript
@CreateDateColumn()    // 创建时间，自动设置
@UpdateDateColumn()    // 更新时间，自动更新
```

### 关系装饰器

#### @OneToMany()
```typescript
@OneToMany(() => TargetEntity, target => target.sourceProperty)
sourceProperty: TargetEntity[];
```

#### @ManyToOne()
```typescript
@ManyToOne(() => TargetEntity, target => target.sourceProperty)
@JoinColumn({ name: 'foreign_key' })
targetProperty: TargetEntity;
```

#### @OneToOne()
```typescript
@OneToOne(() => TargetEntity)
@JoinColumn()
targetProperty: TargetEntity;
```

#### @ManyToMany()
```typescript
@ManyToMany(() => TargetEntity)
@JoinTable()
targetProperties: TargetEntity[];
```

## 🔄 实体使用示例

### 基本 CRUD 操作

#### 创建记录
```typescript
// 创建用户
const user = userRepository.create({
  username: 'john_doe',
  password: 'hashed_password',
  email: 'john@example.com'
});
await userRepository.save(user);

// 创建令牌
const token = tokenRepository.create({
  user_id: user.id,
  token: 'random_token_string',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
});
await tokenRepository.save(token);
```

#### 查询记录
```typescript
// 根据ID查询用户
const user = await userRepository.findOne({
  where: { id: 1 }
});

// 根据用户名查询
const user = await userRepository.findOne({
  where: { username: 'john_doe' }
});

// 查询用户及其令牌
const userWithTokens = await userRepository.findOne({
  where: { id: 1 },
  relations: ['tokens']
});

// 条件查询
const activeTokens = await tokenRepository.find({
  where: {
    is_revoked: 0,
    expires_at: MoreThan(new Date())
  }
});
```

#### 更新记录
```typescript
// 更新用户最后在线时间
await userRepository.update(
  { id: 1 },
  { last_seen: new Date() }
);

// 撤销令牌
await tokenRepository.update(
  { token: 'token_string' },
  { is_revoked: 1 }
);
```

#### 删除记录
```typescript
// 软删除（推荐）
await userRepository.update(
  { id: 1 },
  { deleted_at: new Date() }
);

// 硬删除
await userRepository.delete({ id: 1 });
```

### 复杂查询示例

#### 联表查询
```typescript
const result = await userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.tokens', 'token')
  .where('user.username = :username', { username: 'john_doe' })
  .andWhere('token.is_revoked = :revoked', { revoked: 0 })
  .getOne();
```

#### 聚合查询
```typescript
const tokenCount = await tokenRepository
  .createQueryBuilder('token')
  .where('token.user_id = :userId', { userId: 1 })
  .andWhere('token.is_revoked = :revoked', { revoked: 0 })
  .getCount();
```

#### 分页查询
```typescript
const [users, total] = await userRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
  order: { created_at: 'DESC' }
});
```

## 🔧 数据库配置

### 连接配置
```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'database_name',
  entities: [User, UserToken],
  synchronize: false,  // 生产环境设为 false
  logging: true,       // 开发环境可以开启SQL日志
})
```

### 仓库注入
```typescript
// 在模块中注册
TypeOrmModule.forFeature([User, UserToken])

// 在服务中注入
constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
  @InjectRepository(UserToken)
  private tokenRepository: Repository<UserToken>,
) {}
```

## 📊 数据库关系图

```
┌─────────────────┐         ┌─────────────────────┐
│     users       │         │    user_tokens      │
├─────────────────┤         ├─────────────────────┤
│ id (PK)         │◄────────┤ user_id (FK)        │
│ username (UQ)   │         │ id (PK)             │
│ password_hash   │         │ token (UQ)          │
│ email (UQ)      │         │ token_type          │
│ last_seen       │         │ expires_at          │
│ created_at      │         │ is_revoked          │
│ updated_at      │         │ created_at          │
└─────────────────┘         │ last_used_at        │
                            │ user_agent          │
                            │ ip_address          │
                            └─────────────────────┘
```

## 🧪 测试示例

### 实体测试
```typescript
describe('User Entity', () => {
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, UserToken],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, UserToken]),
      ],
    }).compile();

    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const user = repository.create({
      username: 'test_user',
      password: 'hashed_password',
      email: 'test@example.com'
    });

    const savedUser = await repository.save(user);
    
    expect(savedUser.id).toBeDefined();
    expect(savedUser.username).toBe('test_user');
    expect(savedUser.created_at).toBeDefined();
  });

  it('should enforce unique constraints', async () => {
    const user1 = repository.create({
      username: 'duplicate',
      password: 'password1',
      email: 'email1@example.com'
    });
    await repository.save(user1);

    const user2 = repository.create({
      username: 'duplicate',
      password: 'password2',
      email: 'email2@example.com'
    });

    await expect(repository.save(user2)).rejects.toThrow();
  });
});
```

## 🚀 最佳实践

### 1. 实体设计原则
- 单一职责原则
- 合理的字段长度
- 适当的索引设计
- 清晰的关系定义

### 2. 性能优化
- 合理使用索引
- 避免 N+1 查询问题
- 使用查询构建器优化复杂查询
- 实施数据库连接池

### 3. 数据安全
- 敏感字段加密
- 软删除机制
- 审计日志记录
- 访问权限控制

### 4. 维护性
- 详细的注释文档
- 一致的命名规范
- 版本化的数据库迁移
- 完整的测试覆盖

## 📚 相关文档

- [TypeORM 实体文档](https://typeorm.io/entities)
- [TypeORM 关系文档](https://typeorm.io/relations)
- [MySQL 数据类型](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [数据库设计最佳实践](https://www.sqlstyle.guide/)