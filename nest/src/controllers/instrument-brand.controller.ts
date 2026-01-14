/**
 * 仪器品牌控制器 (instrument-brand.controller.ts)
 * 
 * 提供仪器品牌的管理接口
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
import { InstrumentBrand } from '../entities/instrument-brand.entity';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';
import { AuthGuard } from '../auth/auth.guard';

@Controller('instrument-brands')
@UseGuards(AuthGuard)
export class InstrumentBrandController {
  constructor(
    @InjectRepository(InstrumentBrand)
    private brandRepository: Repository<InstrumentBrand>,
  ) {}

  /**
   * 获取所有品牌
   */
  @Get()
  @CacheConfig(CacheConfigs.LONG) // 品牌数据变化不频繁，使用长期缓存
  async findAll(): Promise<InstrumentBrand[]> {
    return this.brandRepository.find({
      where: { status: 1 },
      order: { name: 'ASC' },
    });
  }

  /**
   * 获取品牌详情
   */
  @Get(':id')
  @CacheConfig(CacheConfigs.LONG)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InstrumentBrand> {
    return this.brandRepository.findOne({
      where: { id, status: 1 },
    });
  }

  /**
   * 创建品牌
   */
  @Post()
  async create(@Body(ValidationPipe) createDto: any): Promise<InstrumentBrand> {
    const brand = this.brandRepository.create(createDto);
    const saved = await this.brandRepository.save(brand);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * 更新品牌
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: any,
  ): Promise<InstrumentBrand> {
    await this.brandRepository.update(id, updateDto);
    return this.findOne(id);
  }

  /**
   * 删除品牌
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.brandRepository.update(id, { status: 0 });
  }
}