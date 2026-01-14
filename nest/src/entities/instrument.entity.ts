/**
 * 仪器实体 (instrument.entity.ts)
 * 
 * 对应数据库表: instruments
 * 仪器管理系统的核心实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { InstrumentCategory } from './instrument-category.entity';
import { InstrumentBrand } from './instrument-brand.entity';
import { User } from './user.entity';

export enum InstrumentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  DAMAGED = 'damaged',
}

export enum ConditionLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200, comment: '仪器名称' })
  name: string;

  @Column({ length: 100, comment: '型号' })
  model: string;

  @Column({ name: 'serial_number', length: 100, unique: true, comment: '序列号/资产编号' })
  serialNumber: string;

  @Column({ name: 'category_id', comment: '分类ID' })
  categoryId: number;

  @Column({ name: 'brand_id', comment: '品牌ID' })
  brandId: number;

  // 基本信息
  @Column({ type: 'json', nullable: true, comment: '技术规格(JSON格式)' })
  specifications: Record<string, any>;

  @Column({ type: 'text', nullable: true, comment: '详细描述' })
  description: string;

  @Column({ name: 'image_urls', type: 'json', nullable: true, comment: '图片URLs(JSON数组)' })
  imageUrls: string[];

  @Column({ name: 'manual_url', length: 500, nullable: true, comment: '说明书URL' })
  manualUrl: string;

  // 采购信息
  @Column({ name: 'purchase_date', type: 'date', nullable: true, comment: '采购日期' })
  purchaseDate: Date;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '采购价格' })
  purchasePrice: number;

  @Column({ length: 200, nullable: true, comment: '供应商' })
  supplier: string;

  @Column({ name: 'warranty_period', nullable: true, comment: '保修期(月)' })
  warrantyPeriod: number;

  @Column({ name: 'warranty_expire_date', type: 'date', nullable: true, comment: '保修到期日期' })
  warrantyExpireDate: Date;

  // 位置信息
  @Column({ length: 200, nullable: true, comment: '存放位置' })
  location: string;

  @Column({ length: 100, nullable: true, comment: '所属部门' })
  department: string;

  @Column({ name: 'responsible_person', length: 100, nullable: true, comment: '负责人' })
  responsiblePerson: string;

  @Column({ name: 'contact_info', length: 200, nullable: true, comment: '联系方式' })
  contactInfo: string;

  // 状态信息
  @Column({
    type: 'enum',
    enum: InstrumentStatus,
    default: InstrumentStatus.AVAILABLE,
    comment: '仪器状态'
  })
  status: InstrumentStatus;

  @Column({
    name: 'condition_level',
    type: 'enum',
    enum: ConditionLevel,
    default: ConditionLevel.EXCELLENT,
    comment: '设备状况'
  })
  conditionLevel: ConditionLevel;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true, comment: '最后维护日期' })
  lastMaintenanceDate: Date;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true, comment: '下次维护日期' })
  nextMaintenanceDate: Date;

  // 使用统计
  @Column({ name: 'usage_hours', default: 0, comment: '累计使用小时数' })
  usageHours: number;

  @Column({ name: 'usage_count', default: 0, comment: '使用次数' })
  usageCount: number;

  // 系统字段
  @Column({ name: 'created_by', nullable: true, comment: '创建人ID' })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true, comment: '更新人ID' })
  updatedBy: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => InstrumentCategory, category => category.instruments)
  @JoinColumn({ name: 'category_id' })
  category: InstrumentCategory;

  @ManyToOne(() => InstrumentBrand, brand => brand.instruments)
  @JoinColumn({ name: 'brand_id' })
  brand: InstrumentBrand;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;
}