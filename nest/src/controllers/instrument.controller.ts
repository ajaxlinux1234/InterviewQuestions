/**
 * 仪器管理控制器 (instrument.controller.ts)
 * 
 * 提供仪器的增删改查 REST API
 * 包含 HTTP 缓存优化和权限验证
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { InstrumentService } from '../services/instrument.service';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';
import { AuthGuard } from '../auth/auth.guard';
import {
  CreateInstrumentDto,
  UpdateInstrumentDto,
  QueryInstrumentDto,
  InstrumentResponseDto,
  PaginatedInstrumentResponseDto,
  InstrumentStatsDto,
} from '../dto/instrument.dto';

/**
 * 仪器管理控制器
 * 
 * @Controller('instruments') 装饰器：
 * - 定义控制器的路由前缀为 '/instruments'
 * - 所有方法的路由都会以 '/instruments' 开头
 * 
 * 路由映射：
 * - GET /instruments -> findAll() (分页查询)
 * - GET /instruments/stats -> getStats() (统计信息)
 * - GET /instruments/search -> search() (搜索)
 * - GET /instruments/:id -> findOne() (详情查询)
 * - POST /instruments -> create() (创建)
 * - PATCH /instruments/:id -> update() (更新)
 * - DELETE /instruments/:id -> remove() (删除)
 * - DELETE /instruments/batch -> removeBatch() (批量删除)
 */
@Controller('instruments')
@UseGuards(AuthGuard) // 所有接口都需要认证
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  /**
   * 创建仪器
   * 
   * POST /instruments
   * 
   * @param createInstrumentDto 创建仪器的数据
   * @param req 请求对象，包含用户信息
   * @returns 创建的仪器信息
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createInstrumentDto: CreateInstrumentDto,
    @Req() req: any,
  ): Promise<InstrumentResponseDto> {
    const userId = req.user.id;
    return this.instrumentService.create(createInstrumentDto, userId);
  }

  /**
   * 分页查询仪器列表
   * 
   * GET /instruments
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 SHORT 缓存策略（1分钟强缓存）
   * - 仪器列表数据变化较频繁，使用短期缓存
   * 
   * @param queryDto 查询参数
   * @returns 分页的仪器列表
   */
  @Get()
  @CacheConfig(CacheConfigs.SHORT)
  async findAll(
    @Query(ValidationPipe) queryDto: QueryInstrumentDto,
  ): Promise<PaginatedInstrumentResponseDto> {
    return this.instrumentService.findAll(queryDto);
  }

  /**
   * 获取仪器统计信息
   * 
   * GET /instruments/stats
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 MEDIUM 缓存策略（5分钟强缓存）
   * - 统计信息变化不频繁，可以使用中期缓存
   * 
   * @returns 仪器统计信息
   */
  @Get('stats')
  @CacheConfig(CacheConfigs.MEDIUM)
  async getStats(): Promise<InstrumentStatsDto> {
    return this.instrumentService.getStats();
  }

  /**
   * 搜索仪器
   * 
   * GET /instruments/search
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 SHORT 缓存策略（1分钟强缓存）
   * - 搜索结果可能频繁变化，使用短期缓存
   * 
   * @param keyword 搜索关键词
   * @param limit 返回数量限制
   * @returns 搜索结果
   */
  @Get('search')
  @CacheConfig(CacheConfigs.SHORT)
  async search(
    @Query('keyword') keyword: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<InstrumentResponseDto[]> {
    return this.instrumentService.search(keyword, limit);
  }

  /**
   * 查询仪器详情
   * 
   * GET /instruments/:id
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 MEDIUM 缓存策略（5分钟强缓存）
   * - 仪器详情相对稳定，适合中期缓存
   * 
   * @param id 仪器ID
   * @returns 仪器详情
   */
  @Get(':id')
  @CacheConfig(CacheConfigs.MEDIUM)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InstrumentResponseDto> {
    return this.instrumentService.findOne(id);
  }

  /**
   * 更新仪器信息
   * 
   * PATCH /instruments/:id
   * 
   * @param id 仪器ID
   * @param updateInstrumentDto 更新数据
   * @param req 请求对象，包含用户信息
   * @returns 更新后的仪器信息
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateInstrumentDto: UpdateInstrumentDto,
    @Req() req: any,
  ): Promise<InstrumentResponseDto> {
    const userId = req.user.id;
    return this.instrumentService.update(id, updateInstrumentDto, userId);
  }

  /**
   * 删除仪器
   * 
   * DELETE /instruments/:id
   * 
   * @param id 仪器ID
   * @returns 无返回内容
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.instrumentService.remove(id);
  }

  /**
   * 批量删除仪器
   * 
   * DELETE /instruments/batch
   * 
   * @param ids 仪器ID数组
   * @returns 无返回内容
   */
  @Delete('batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBatch(@Body('ids') ids: number[]): Promise<void> {
    return this.instrumentService.removeBatch(ids);
  }
}

/**
 * 控制器设计原则：
 * 
 * 1. RESTful API 设计：遵循 REST 规范
 * 2. 统一错误处理：使用 NestJS 异常过滤器
 * 3. 数据验证：使用 ValidationPipe 和 DTO
 * 4. 权限控制：使用 AuthGuard 保护所有接口
 * 5. HTTP 缓存：根据数据特性配置不同缓存策略
 * 6. 响应状态码：使用合适的 HTTP 状态码
 * 
 * HTTP 状态码说明：
 * - 200: 查询成功
 * - 201: 创建成功
 * - 204: 删除成功（无内容返回）
 * - 400: 请求参数错误
 * - 401: 未授权
 * - 404: 资源不存在
 * - 500: 服务器内部错误
 * 
 * 缓存策略说明：
 * - GET /instruments: SHORT (1分钟) - 列表数据变化频繁
 * - GET /instruments/stats: MEDIUM (5分钟) - 统计数据变化不频繁
 * - GET /instruments/search: SHORT (1分钟) - 搜索结果可能变化
 * - GET /instruments/:id: MEDIUM (5分钟) - 详情数据相对稳定
 * - POST/PATCH/DELETE: 不缓存 - 数据修改操作
 */