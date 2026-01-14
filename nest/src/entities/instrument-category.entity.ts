/**
 * 仪器分类实体 (instrument-category.entity.ts)
 * 
 * 对应数据库表: instrument_categories
 * 用于管理仪器的分类信息，支持层级结构
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Instrument } from './instrument.entity';

@Entity('instrument_categories')
export class InstrumentCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '分类名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '分类编码' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '分类描述' })
  description: string;

  @Column({ name: 'parent_id', nullable: true, comment: '父分类ID' })
  parentId: number;

  @Column({ name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ type: 'tinyint', default: 1, comment: '状态: 1-启用, 0-禁用' })
  status: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => InstrumentCategory, category => category.children)
  @JoinColumn({ name: 'parent_id' })
  parent: InstrumentCategory;

  @OneToMany(() => InstrumentCategory, category => category.parent)
  children: InstrumentCategory[];

  @OneToMany(() => Instrument, instrument => instrument.category)
  instruments: Instrument[];
}