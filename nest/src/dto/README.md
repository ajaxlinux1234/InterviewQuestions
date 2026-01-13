# DTO 目录 (Data Transfer Objects)

DTO 目录包含数据传输对象类，定义了 API 接口的输入输出数据结构，提供类型安全和数据验证。

## 📁 目录结构

```
dto/
├── auth.dto.ts      # 认证相关的 DTO 类型定义
└── README.md        # 本文档
```

## 🎯 DTO 职责

### 1. 数据结构定义
- 定义 API 输入输出格式
- 指定字段类型和约束
- 提供类型安全保障
- 统一数据传输标准

### 2. 数据验证
- 输入数据格式验证
- 必需字段检查
- 数据类型转换
- 业务规则验证

### 3. API 文档
- 自动生成 API 文档
- 接口参数说明
- 响应格式定义
- 示例数据提供

### 4. 类型安全
- TypeScript 类型检查
- 编译时错误检测
- IDE 智能提示
- 重构安全保障

## 📋 DTO 详情

### AuthDto (认证相关 DTO)

**功能：** 定义认证模块的输入输出数据结构

#### LoginDto (登录请求 DTO)
```typescript
export class LoginDto {
  username: string;    // 用户名
  password: string;    // 密码（前端已MD5加密）
}
```

**使用场景：** POST /auth/login 接口的请求体

**示例数据：**
```json
{
  "username": "john_doe",
  "password": "5d41402abc4b2a76b9719d911017c592"
}
```

#### RegisterDto (注册请求 DTO)
```typescript
export class RegisterDto {
  username: string;    // 用户名
  password: string;    // 密码（前端已MD5加密）
  email?: string;      // 邮箱（可选）
}
```

**使用场景：** POST /auth/register 接口的请求体

**示例数据：**
```json
{
  "username": "john_doe",
  "password": "5d41402abc4b2a76b9719d911017c592",
  "email": "john@example.com"
}
```

#### LoginResponseDto (登录响应 DTO)
```typescript
export class LoginResponseDto {
  success: boolean;    // 操作是否成功
  message: string;     // 响应消息
  data?: {            // 响应数据（可选）
    token: string;           // 访问令牌
    expires_at: string;      // 过期时间
    user: {                  // 用户信息
      id: number;
      username: string;
      email?: string;
    };
  };
}
```

**使用场景：** POST /auth/login 接口的响应体

**示例数据：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "a1b2c3d4e5f6...",
    "expires_at": "2024-02-13T10:30:00.000Z",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

#### LogoutResponseDto (退出响应 DTO)
```typescript
export class LogoutResponseDto {
  success: boolean;    // 操作是否成功
  message: string;     // 响应消息
}
```

**使用场景：** POST /auth/logout 接口的响应体

**示例数据：**
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

## 🛠️ DTO 使用方式

### 在控制器中使用
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 使用 DTO 作为请求体类型
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  // 使用 DTO 作为请求体类型
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }
}
```

### 在服务中使用
```typescript
@Injectable()
export class AuthService {
  // 使用 DTO 作为参数类型
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;
    
    // 业务逻辑处理
    const result = await this.validateUser(username, password);
    
    // 返回符合 DTO 结构的数据
    return {
      success: true,
      message: '登录成功',
      data: {
        token: result.token,
        expires_at: result.expires_at,
        user: result.user
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, email } = registerDto;
    
    // 注册逻辑
    const user = await this.createUser(username, password, email);
    
    return {
      success: true,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }
}
```

## 🔧 数据验证

### 使用 class-validator 进行验证
```typescript
import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)  // MD5 哈希长度
  @MaxLength(32)
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(32)
  password: string;
}
```

### 启用全局验证管道
```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用全局验证
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // 只保留 DTO 中定义的属性
    forbidNonWhitelisted: true,  // 拒绝未定义的属性
    transform: true,        // 自动类型转换
  }));
  
  await app.listen(3000);
}
```

## 📊 DTO 设计模式

### 输入 DTO (Input DTO)
```typescript
// 用于接收客户端请求数据
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;
}
```

### 输出 DTO (Output DTO)
```typescript
// 用于返回给客户端的数据
export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  // 注意：不包含敏感信息如密码
}
```

### 更新 DTO (Update DTO)
```typescript
// 用于更新操作，字段通常是可选的
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDate()
  last_seen?: Date;
}
```

### 查询 DTO (Query DTO)
```typescript
// 用于查询参数
export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

## 🔄 DTO 转换

### 实体到 DTO 转换
```typescript
export class UserService {
  // 将实体转换为响应 DTO
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.toResponseDto(user);
  }
}
```

### 使用 class-transformer
```typescript
import { Exclude, Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ value }) => value.toISOString())
  created_at: string;

  @Exclude()  // 排除敏感字段
  password: string;
}

// 在服务中使用
import { plainToClass } from 'class-transformer';

async findById(id: number): Promise<UserResponseDto> {
  const user = await this.userRepository.findOne({ where: { id } });
  return plainToClass(UserResponseDto, user);
}
```

## 🧪 DTO 测试

### 验证测试
```typescript
import { validate } from 'class-validator';
import { RegisterDto } from './auth.dto';

describe('RegisterDto', () => {
  it('should validate correct data', async () => {
    const dto = new RegisterDto();
    dto.username = 'john_doe';
    dto.password = '5d41402abc4b2a76b9719d911017c592';
    dto.email = 'john@example.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid email', async () => {
    const dto = new RegisterDto();
    dto.username = 'john_doe';
    dto.password = '5d41402abc4b2a76b9719d911017c592';
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });

  it('should reject short username', async () => {
    const dto = new RegisterDto();
    dto.username = 'jo';  // 太短
    dto.password = '5d41402abc4b2a76b9719d911017c592';
    dto.email = 'john@example.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('username');
  });
});
```

### 控制器测试
```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should handle login with valid DTO', async () => {
    const loginDto: LoginDto = {
      username: 'john_doe',
      password: '5d41402abc4b2a76b9719d911017c592'
    };

    const expectedResponse: LoginResponseDto = {
      success: true,
      message: '登录成功',
      data: {
        token: 'mock_token',
        expires_at: '2024-02-13T10:30:00.000Z',
        user: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com'
        }
      }
    };

    jest.spyOn(service, 'login').mockResolvedValue(expectedResponse);

    const result = await controller.login(loginDto);

    expect(result).toEqual(expectedResponse);
    expect(service.login).toHaveBeenCalledWith(loginDto);
  });
});
```

## 🚀 最佳实践

### 1. DTO 设计原则
- 单一职责：每个 DTO 只负责一个特定的数据传输场景
- 不可变性：DTO 应该是只读的数据结构
- 验证完整：包含所有必要的验证规则
- 文档清晰：提供清晰的字段说明

### 2. 命名规范
- 输入 DTO：`CreateXxxDto`、`UpdateXxxDto`、`XxxQueryDto`
- 输出 DTO：`XxxResponseDto`、`XxxDto`
- 一致性：保持项目内命名风格一致

### 3. 验证策略
- 前端验证：提升用户体验
- 后端验证：确保数据安全
- 业务验证：在服务层进行复杂业务规则验证
- 数据库约束：最后一道防线

### 4. 性能考虑
- 避免过度验证：只验证必要的字段
- 合理使用转换：避免不必要的数据转换
- 缓存验证结果：对于复杂验证可以考虑缓存
- 异步验证：对于耗时的验证使用异步处理

## 📚 相关文档

- [class-validator 文档](https://github.com/typestack/class-validator)
- [class-transformer 文档](https://github.com/typestack/class-transformer)
- [NestJS Validation 文档](https://docs.nestjs.com/techniques/validation)
- [TypeScript 类型系统](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)