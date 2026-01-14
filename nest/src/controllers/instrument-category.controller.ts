/**
 * 仪器分类控制器 (instrument-category.controller.ts)
 * 
 * 提供仪器分类的管理接口
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstrumentCategory } from '../entities/instrument-category.entity';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';
import { AuthGuard } from '../auth/auth.guard';

@Controller('instrument-categories')
@UseGuards(AuthGuard)
export class InstrumentCategoryController {
  constructor(
    @InjectRepository(InstrumentCategory)
    private categoryRepository: Repository<InstrumentCategory>,
  ) {}

  /**
   * 获取所有分类（树形结构）
   */
  @Get()
  @CacheConfig(CacheConfigs.LONG) // 分类数据变化不频繁，使用长期缓存
  async findAll(): Promise<InstrumentCategory[]> {
    return this.categoryRepository.find({
      where: { status: 1 },
      relations: ['children'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取分类详情
   */
  @Get(':id')
  @CacheConfig(CacheConfigs.LONG)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InstrumentCategory> {
    return this.categoryRepository.findOne({
      where: { id, status: 1 },
      relations: ['parent', 'children'],
    });
  }

  /**
   * 创建分类
   */
  @Post()
  async create(@Body(ValidationPipe) createDto: any): Promise<InstrumentCategory> {
    const category = this.categoryRepository.create(createDto);
    const saved = await this.categoryRepository.save(category);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * 更新分类
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: any,
  ): Promise<InstrumentCategory> {
    await this.categoryRepository.update(id, updateDto);
    return this.findOne(id);
  }

  /**
   * 删除分类
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoryRepository.update(id, { status: 0 });
  }
}