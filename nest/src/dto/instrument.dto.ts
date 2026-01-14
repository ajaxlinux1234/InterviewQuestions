/**
 * 仪器管理 DTO (instrument.dto.ts)
 * 
 * 定义仪器相关的数据传输对象
 * 用于API请求和响应的数据验证和类型定义
 */

import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, IsObject, Min, Max, IsNotEmpty, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InstrumentStatus, ConditionLevel } from '../entities/instrument.entity';

/**
 * 创建仪器 DTO
 */
export class CreateInstrumentDto {
  @IsNotEmpty({ message: '仪器名称不能为空' })
  @IsString({ message: '仪器名称必须是字符串' })
  @Length(1, 200, { message: '仪器名称长度必须在1-200字符之间' })
  name: string;

  @IsNotEmpty({ message: '型号不能为空' })
  @IsString({ message: '型号必须是字符串' })
  @Length(1, 100, { message: '型号长度必须在1-100字符之间' })
  model: string;

  @IsNotEmpty({ message: '序列号不能为空' })
  @IsString({ message: '序列号必须是字符串' })
  @Length(1, 100, { message: '序列号长度必须在1-100字符之间' })
  serialNumber: string;

  @IsNotEmpty({ message: '分类ID不能为空' })
  @IsNumber({}, { message: '分类ID必须是数字' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId: number;

  @IsNotEmpty({ message: '品牌ID不能为空' })
  @IsNumber({}, { message: '品牌ID必须是数字' })
  @Min(1, { message: '品牌ID必须大于0' })
  brandId: number;

  @IsOptional()
  @IsObject({ message: '技术规格必须是对象' })
  specifications?: Record<string, any>;

  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsArray({ message: '图片URLs必须是数组' })
  @IsString({ each: true, message: '图片URL必须是字符串' })
  imageUrls?: string[];

  @IsOptional()
  @IsString({ message: '说明书URL必须是字符串' })
  manualUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: '采购日期格式不正确' })
  purchaseDate?: string;

  @IsOptional()
  @IsNumber({}, { message: '采购价格必须是数字' })
  @Min(0, { message: '采购价格不能为负数' })
  purchasePrice?: number;

  @IsOptional()
  @IsString({ message: '供应商必须是字符串' })
  supplier?: string;

  @IsOptional()
  @IsNumber({}, { message: '保修期必须是数字' })
  @Min(0, { message: '保修期不能为负数' })
  warrantyPeriod?: number;

  @IsOptional()
  @IsDateString({}, { message: '保修到期日期格式不正确' })
  warrantyExpireDate?: string;

  @IsOptional()
  @IsString({ message: '存放位置必须是字符串' })
  location?: string;

  @IsOptional()
  @IsString({ message: '所属部门必须是字符串' })
  department?: string;

  @IsOptional()
  @IsString({ message: '负责人必须是字符串' })
  responsiblePerson?: string;

  @IsOptional()
  @IsString({ message: '联系方式必须是字符串' })
  contactInfo?: string;

  @IsOptional()
  @IsEnum(InstrumentStatus, { message: '仪器状态值不正确' })
  status?: InstrumentStatus;

  @IsOptional()
  @IsEnum(ConditionLevel, { message: '设备状况值不正确' })
  conditionLevel?: ConditionLevel;

  @IsOptional()
  @IsDateString({}, { message: '最后维护日期格式不正确' })
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString({}, { message: '下次维护日期格式不正确' })
  nextMaintenanceDate?: string;
}

/**
 * 更新仪器 DTO
 */
export class UpdateInstrumentDto {
  @IsOptional()
  @IsString({ message: '仪器名称必须是字符串' })
  @Length(1, 200, { message: '仪器名称长度必须在1-200字符之间' })
  name?: string;

  @IsOptional()
  @IsString({ message: '型号必须是字符串' })
  @Length(1, 100, { message: '型号长度必须在1-100字符之间' })
  model?: string;

  @IsOptional()
  @IsString({ message: '序列号必须是字符串' })
  @Length(1, 100, { message: '序列号长度必须在1-100字符之间' })
  serialNumber?: string;

  @IsOptional()
  @IsNumber({}, { message: '分类ID必须是数字' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId?: number;

  @IsOptional()
  @IsNumber({}, { message: '品牌ID必须是数字' })
  @Min(1, { message: '品牌ID必须大于0' })
  brandId?: number;

  @IsOptional()
  @IsObject({ message: '技术规格必须是对象' })
  specifications?: Record<string, any>;

  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsArray({ message: '图片URLs必须是数组' })
  @IsString({ each: true, message: '图片URL必须是字符串' })
  imageUrls?: string[];

  @IsOptional()
  @IsString({ message: '说明书URL必须是字符串' })
  manualUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: '采购日期格式不正确' })
  purchaseDate?: string;

  @IsOptional()
  @IsNumber({}, { message: '采购价格必须是数字' })
  @Min(0, { message: '采购价格不能为负数' })
  purchasePrice?: number;

  @IsOptional()
  @IsString({ message: '供应商必须是字符串' })
  supplier?: string;

  @IsOptional()
  @IsNumber({}, { message: '保修期必须是数字' })
  @Min(0, { message: '保修期不能为负数' })
  warrantyPeriod?: number;

  @IsOptional()
  @IsDateString({}, { message: '保修到期日期格式不正确' })
  warrantyExpireDate?: string;

  @IsOptional()
  @IsString({ message: '存放位置必须是字符串' })
  location?: string;

  @IsOptional()
  @IsString({ message: '所属部门必须是字符串' })
  department?: string;

  @IsOptional()
  @IsString({ message: '负责人必须是字符串' })
  responsiblePerson?: string;

  @IsOptional()
  @IsString({ message: '联系方式必须是字符串' })
  contactInfo?: string;

  @IsOptional()
  @IsEnum(InstrumentStatus, { message: '仪器状态值不正确' })
  status?: InstrumentStatus;

  @IsOptional()
  @IsEnum(ConditionLevel, { message: '设备状况值不正确' })
  conditionLevel?: ConditionLevel;

  @IsOptional()
  @IsDateString({}, { message: '最后维护日期格式不正确' })
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsDateString({}, { message: '下次维护日期格式不正确' })
  nextMaintenanceDate?: string;
}

/**
 * 仪器查询 DTO
 */
export class QueryInstrumentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须是数字' })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '品牌ID必须是数字' })
  brandId?: number;

  @IsOptional()
  @IsEnum(InstrumentStatus, { message: '状态值不正确' })
  status?: InstrumentStatus;

  @IsOptional()
  @IsString({ message: '部门必须是字符串' })
  department?: string;

  @IsOptional()
  @IsString({ message: '位置必须是字符串' })
  location?: string;

  @IsOptional()
  @IsEnum(ConditionLevel, { message: '设备状况值不正确' })
  conditionLevel?: ConditionLevel;

  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy?: string = 'updatedAt';

  @IsOptional()
  @IsString({ message: '排序方向必须是字符串' })
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * 仪器响应 DTO
 */
export class InstrumentResponseDto {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  categoryId: number;
  brandId: number;
  specifications?: Record<string, any>;
  description?: string;
  imageUrls?: string[];
  manualUrl?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  supplier?: string;
  warrantyPeriod?: number;
  warrantyExpireDate?: Date;
  location?: string;
  department?: string;
  responsiblePerson?: string;
  contactInfo?: string;
  status: InstrumentStatus;
  conditionLevel: ConditionLevel;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  usageHours: number;
  usageCount: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // 关联数据
  category?: {
    id: number;
    name: string;
    code: string;
  };
  
  brand?: {
    id: number;
    name: string;
    code: string;
    logoUrl?: string;
  };
}

/**
 * 分页响应 DTO
 */
export class PaginatedInstrumentResponseDto {
  data: InstrumentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 仪器统计 DTO
 */
export class InstrumentStatsDto {
  totalCount: number;
  availableCount: number;
  inUseCount: number;
  maintenanceCount: number;
  retiredCount: number;
  damagedCount: number;
  categoryStats: Array<{
    categoryId: number;
    categoryName: string;
    count: number;
  }>;
  brandStats: Array<{
    brandId: number;
    brandName: string;
    count: number;
  }>;
  departmentStats: Array<{
    department: string;
    count: number;
  }>;
}