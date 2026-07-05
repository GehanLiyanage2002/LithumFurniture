import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credit } from './credit.entity';
import { Payment } from './payment.entity';

import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Credit, Payment]), ProductsModule],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
