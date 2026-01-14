/**
 * 仪器品牌实体 (instrument-brand.entity.ts)
 * 
 * 对应数据库表: instrument_brands
 * 用于管理仪器品牌信息
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Instrument } from './instrument.entity';

@Entity('instrument_brands')
export class InstrumentBrand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '品牌名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '品牌编码' })
  code: string;

  @Column({ name: 'logo_url', length: 500, nullable: true, comment: '品牌Logo URL' })
  logoUrl: string;

  @Column({ length: 200, nullable: true, comment: '官网地址' })
  website: string;

  @Column({ length: 50, nullable: true, comment: '国家' })
  country: string;

  @Column({ type: 'text', nullable: true, comment: '品牌描述' })
  description: string;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 1-启用, 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => Instrument, instrument => instrument.brand)
  instruments: Instrument[];
}