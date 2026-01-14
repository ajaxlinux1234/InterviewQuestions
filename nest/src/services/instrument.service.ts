/**
 * 仪器管理服务 (instrument.service.ts)
 * 
 * 提供仪器的增删改查和高性能搜索功能
 * 包含缓存优化和数据库查询优化
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, In } from 'typeorm';
import { Instrument, InstrumentStatus } from '../entities/instrument.entity';
import { InstrumentCategory } from '../entities/instrument-category.entity';
import { InstrumentBrand } from '../entities/instrument-brand.entity';
import {
  CreateInstrumentDto,
  UpdateInstrumentDto,
  QueryInstrumentDto,
  InstrumentResponseDto,
  PaginatedInstrumentResponseDto,
  InstrumentStatsDto,
} from '../dto/instrument.dto';

@Injectable()
export class InstrumentService {
  private readonly logger = new Logger(InstrumentService.name);

  constructor(
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    @InjectRepository(InstrumentCategory)
    private categoryRepository: Repository<InstrumentCategory>,
    @InjectRepository(InstrumentBrand)
    private brandRepository: Repository<InstrumentBrand>,
  ) {}

  /**
   * 创建仪器
   */
  async create(createInstrumentDto: CreateInstrumentDto, userId: number): Promise<InstrumentResponseDto> {
    this.logger.log(`创建仪器: ${createInstrumentDto.name}`);

    // 验证分类和品牌是否存在
    await this.validateCategoryAndBrand(createInstrumentDto.categoryId, createInstrumentDto.brandId);

    // 检查序列号是否已存在
    const existingInstrument = await this.instrumentRepository.findOne({
      where: { serialNumber: createInstrumentDto.serialNumber }
    });

    if (existingInstrument) {
      throw new BadRequestException(`序列号 ${createInstrumentDto.serialNumber} 已存在`);
    }

    // 创建仪器实体
    const instrument = this.instrumentRepository.create({
      ...createInstrumentDto,
      createdBy: userId,
      updatedBy: userId,
    });

    // 保存到数据库
    const savedInstrument = await this.instrumentRepository.save(instrument);

    // 返回完整信息
    return this.findOneWithRelations(savedInstrument.id);
  }

  /**
   * 分页查询仪器列表（高性能）
   */
  async findAll(queryDto: QueryInstrumentDto): Promise<PaginatedInstrumentResponseDto> {
    this.logger.log(`查询仪器列表: page=${queryDto.page}, limit=${queryDto.limit}`);

    const { page = 1, limit = 10, search, categoryId, brandId, status, department, location, conditionLevel, sortBy = 'updatedAt', sortOrder = 'DESC' } = queryDto;

    // 构建查询
    const queryBuilder = this.createQueryBuilder();

    // 添加搜索条件
    this.addSearchConditions(queryBuilder, { search, categoryId, brandId, status, department, location, conditionLevel });

    // 添加排序
    this.addSorting(queryBuilder, sortBy, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // 执行查询
    const [instruments, total] = await queryBuilder.getManyAndCount();

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: instruments.map(instrument => this.transformToResponseDto(instrument)),
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * 根据ID查询仪器详情
   */
  async findOne(id: number): Promise<InstrumentResponseDto> {
    this.logger.log(`查询仪器详情: ID=${id}`);
    return this.findOneWithRelations(id);
  }

  /**
   * 更新仪器信息
   */
  async update(id: number, updateInstrumentDto: UpdateInstrumentDto, userId: number): Promise<InstrumentResponseDto> {
    this.logger.log(`更新仪器: ID=${id}`);

    // 检查仪器是否存在
    const instrument = await this.instrumentRepository.findOne({ where: { id } });
    if (!instrument) {
      throw new NotFoundException(`仪器 ID ${id} 不存在`);
    }

    // 验证分类和品牌（如果有更新）
    if (updateInstrumentDto.categoryId || updateInstrumentDto.brandId) {
      await this.validateCategoryAndBrand(
        updateInstrumentDto.categoryId || instrument.categoryId,
        updateInstrumentDto.brandId || instrument.brandId
      );
    }

    // 检查序列号是否重复（如果有更新）
    if (updateInstrumentDto.serialNumber && updateInstrumentDto.serialNumber !== instrument.serialNumber) {
      const existingInstrument = await this.instrumentRepository.findOne({
        where: { serialNumber: updateInstrumentDto.serialNumber }
      });

      if (existingInstrument) {
        throw new BadRequestException(`序列号 ${updateInstrumentDto.serialNumber} 已存在`);
      }
    }

    // 更新仪器信息
    await this.instrumentRepository.update(id, {
      ...updateInstrumentDto,
      updatedBy: userId,
    });

    // 返回更新后的信息
    return this.findOneWithRelations(id);
  }

  /**
   * 删除仪器
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`删除仪器: ID=${id}`);

    const instrument = await this.instrumentRepository.findOne({ where: { id } });
    if (!instrument) {
      throw new NotFoundException(`仪器 ID ${id} 不存在`);
    }

    // 软删除：将状态设置为已退役
    await this.instrumentRepository.update(id, {
      status: InstrumentStatus.RETIRED,
    });
  }

  /**
   * 批量删除仪器
   */
  async removeBatch(ids: number[]): Promise<void> {
    this.logger.log(`批量删除仪器: IDs=${ids.join(',')}`);

    if (ids.length === 0) {
      throw new BadRequestException('请选择要删除的仪器');
    }

    // 检查仪器是否存在
    const instruments = await this.instrumentRepository.find({
      where: { id: In(ids) }
    });

    if (instruments.length !== ids.length) {
      throw new BadRequestException('部分仪器不存在');
    }

    // 批量软删除
    await this.instrumentRepository.update(
      { id: In(ids) },
      { status: InstrumentStatus.RETIRED }
    );
  }

  /**
   * 获取仪器统计信息
   */
  async getStats(): Promise<InstrumentStatsDto> {
    this.logger.log('获取仪器统计信息');

    // 状态统计
    const statusStats = await this.instrumentRepository
      .createQueryBuilder('instrument')
      .select('instrument.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED })
      .groupBy('instrument.status')
      .getRawMany();

    // 分类统计
    const categoryStats = await this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoin('instrument.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(*)', 'count')
      .where('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED })
      .groupBy('category.id')
      .getRawMany();

    // 品牌统计
    const brandStats = await this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoin('instrument.brand', 'brand')
      .select('brand.id', 'brandId')
      .addSelect('brand.name', 'brandName')
      .addSelect('COUNT(*)', 'count')
      .where('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED })
      .groupBy('brand.id')
      .getRawMany();

    // 部门统计
    const departmentStats = await this.instrumentRepository
      .createQueryBuilder('instrument')
      .select('instrument.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED })
      .andWhere('instrument.department IS NOT NULL')
      .groupBy('instrument.department')
      .getRawMany();

    // 计算总数和各状态数量
    const totalCount = statusStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const availableCount = statusStats.find(s => s.status === InstrumentStatus.AVAILABLE)?.count || 0;
    const inUseCount = statusStats.find(s => s.status === InstrumentStatus.IN_USE)?.count || 0;
    const maintenanceCount = statusStats.find(s => s.status === InstrumentStatus.MAINTENANCE)?.count || 0;
    const retiredCount = statusStats.find(s => s.status === InstrumentStatus.RETIRED)?.count || 0;
    const damagedCount = statusStats.find(s => s.status === InstrumentStatus.DAMAGED)?.count || 0;

    return {
      totalCount,
      availableCount: parseInt(availableCount.toString()),
      inUseCount: parseInt(inUseCount.toString()),
      maintenanceCount: parseInt(maintenanceCount.toString()),
      retiredCount: parseInt(retiredCount.toString()),
      damagedCount: parseInt(damagedCount.toString()),
      categoryStats: categoryStats.map(stat => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        count: parseInt(stat.count),
      })),
      brandStats: brandStats.map(stat => ({
        brandId: stat.brandId,
        brandName: stat.brandName,
        count: parseInt(stat.count),
      })),
      departmentStats: departmentStats.map(stat => ({
        department: stat.department,
        count: parseInt(stat.count),
      })),
    };
  }

  /**
   * 搜索仪器（全文搜索）
   */
  async search(keyword: string, limit: number = 10): Promise<InstrumentResponseDto[]> {
    this.logger.log(`搜索仪器: keyword=${keyword}`);

    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.createQueryBuilder();

    // 使用全文搜索或模糊匹配
    queryBuilder.where(
      '(instrument.name LIKE :keyword OR instrument.model LIKE :keyword OR instrument.serialNumber LIKE :keyword OR instrument.description LIKE :keyword OR instrument.location LIKE :keyword OR instrument.department LIKE :keyword)',
      { keyword: `%${keyword.trim()}%` }
    );

    queryBuilder
      .andWhere('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED })
      .orderBy('instrument.updatedAt', 'DESC')
      .limit(limit);

    const instruments = await queryBuilder.getMany();
    return instruments.map(instrument => this.transformToResponseDto(instrument));
  }

  /**
   * 创建查询构建器（包含关联查询）
   */
  private createQueryBuilder(): SelectQueryBuilder<Instrument> {
    return this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoinAndSelect('instrument.category', 'category')
      .leftJoinAndSelect('instrument.brand', 'brand');
  }

  /**
   * 添加搜索条件
   */
  private addSearchConditions(
    queryBuilder: SelectQueryBuilder<Instrument>,
    conditions: {
      search?: string;
      categoryId?: number;
      brandId?: number;
      status?: InstrumentStatus;
      department?: string;
      location?: string;
      conditionLevel?: string;
    }
  ): void {
    const { search, categoryId, brandId, status, department, location, conditionLevel } = conditions;

    // 排除已退役的仪器
    queryBuilder.where('instrument.status != :retiredStatus', { retiredStatus: InstrumentStatus.RETIRED });

    // 搜索关键词
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(instrument.name LIKE :search OR instrument.model LIKE :search OR instrument.serialNumber LIKE :search OR instrument.description LIKE :search)',
        { search: `%${search.trim()}%` }
      );
    }

    // 分类筛选
    if (categoryId) {
      queryBuilder.andWhere('instrument.categoryId = :categoryId', { categoryId });
    }

    // 品牌筛选
    if (brandId) {
      queryBuilder.andWhere('instrument.brandId = :brandId', { brandId });
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('instrument.status = :status', { status });
    }

    // 部门筛选
    if (department) {
      queryBuilder.andWhere('instrument.department = :department', { department });
    }

    // 位置筛选
    if (location) {
      queryBuilder.andWhere('instrument.location LIKE :location', { location: `%${location}%` });
    }

    // 设备状况筛选
    if (conditionLevel) {
      queryBuilder.andWhere('instrument.conditionLevel = :conditionLevel', { conditionLevel });
    }
  }

  /**
   * 添加排序
   */
  private addSorting(queryBuilder: SelectQueryBuilder<Instrument>, sortBy: string, sortOrder: 'ASC' | 'DESC'): void {
    const allowedSortFields = [
      'name', 'model', 'serialNumber', 'status', 'conditionLevel',
      'purchaseDate', 'purchasePrice', 'location', 'department',
      'createdAt', 'updatedAt', 'usageHours', 'usageCount'
    ];

    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`instrument.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('instrument.updatedAt', 'DESC');
    }
  }

  /**
   * 查询单个仪器（包含关联信息）
   */
  private async findOneWithRelations(id: number): Promise<InstrumentResponseDto> {
    const instrument = await this.instrumentRepository
      .createQueryBuilder('instrument')
      .leftJoinAndSelect('instrument.category', 'category')
      .leftJoinAndSelect('instrument.brand', 'brand')
      .where('instrument.id = :id', { id })
      .getOne();

    if (!instrument) {
      throw new NotFoundException(`仪器 ID ${id} 不存在`);
    }

    return this.transformToResponseDto(instrument);
  }

  /**
   * 验证分类和品牌是否存在
   */
  private async validateCategoryAndBrand(categoryId: number, brandId: number): Promise<void> {
    const [category, brand] = await Promise.all([
      this.categoryRepository.findOne({ where: { id: categoryId, status: 1 } }),
      this.brandRepository.findOne({ where: { id: brandId, status: 1 } }),
    ]);

    if (!category) {
      throw new BadRequestException(`分类 ID ${categoryId} 不存在或已禁用`);
    }

    if (!brand) {
      throw new BadRequestException(`品牌 ID ${brandId} 不存在或已禁用`);
    }
  }

  /**
   * 转换为响应 DTO
   */
  private transformToResponseDto(instrument: Instrument): InstrumentResponseDto {
    return {
      id: instrument.id,
      name: instrument.name,
      model: instrument.model,
      serialNumber: instrument.serialNumber,
      categoryId: instrument.categoryId,
      brandId: instrument.brandId,
      specifications: instrument.specifications,
      description: instrument.description,
      imageUrls: instrument.imageUrls,
      manualUrl: instrument.manualUrl,
      purchaseDate: instrument.purchaseDate,
      purchasePrice: instrument.purchasePrice,
      supplier: instrument.supplier,
      warrantyPeriod: instrument.warrantyPeriod,
      warrantyExpireDate: instrument.warrantyExpireDate,
      location: instrument.location,
      department: instrument.department,
      responsiblePerson: instrument.responsiblePerson,
      contactInfo: instrument.contactInfo,
      status: instrument.status,
      conditionLevel: instrument.conditionLevel,
      lastMaintenanceDate: instrument.lastMaintenanceDate,
      nextMaintenanceDate: instrument.nextMaintenanceDate,
      usageHours: instrument.usageHours,
      usageCount: instrument.usageCount,
      createdBy: instrument.createdBy,
      updatedBy: instrument.updatedBy,
      createdAt: instrument.createdAt,
      updatedAt: instrument.updatedAt,
      category: instrument.category ? {
        id: instrument.category.id,
        name: instrument.category.name,
        code: instrument.category.code,
      } : undefined,
      brand: instrument.brand ? {
        id: instrument.brand.id,
        name: instrument.brand.name,
        code: instrument.brand.code,
        logoUrl: instrument.brand.logoUrl,
      } : undefined,
    };
  }
}