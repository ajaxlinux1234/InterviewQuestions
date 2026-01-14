/**
 * 仪器管理模块 (instrument.module.ts)
 * 
 * 整合仪器管理相关的所有组件
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from '../entities/instrument.entity';
import { InstrumentCategory } from '../entities/instrument-category.entity';
import { InstrumentBrand } from '../entities/instrument-brand.entity';
import { InstrumentService } from '../services/instrument.service';
import { InstrumentController } from '../controllers/instrument.controller';
import { InstrumentCategoryController } from '../controllers/instrument-category.controller';
import { InstrumentBrandController } from '../controllers/instrument-brand.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Instrument,
      InstrumentCategory,
      InstrumentBrand,
    ]),
    // 导入 AuthModule 以使用 AuthGuard 和 AuthService
    AuthModule,
  ],
  controllers: [
    InstrumentController,
    InstrumentCategoryController,
    InstrumentBrandController,
  ],
  providers: [
    InstrumentService,
  ],
  exports: [
    InstrumentService,
  ],
})
export class InstrumentModule {}