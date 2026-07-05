import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashSale } from './cash-sale.entity';
import { CashSalesService } from './cash-sales.service';
import { CashSalesController } from './cash-sales.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([CashSale]), ProductsModule],
  providers: [CashSalesService],
  controllers: [CashSalesController],
})
export class CashSalesModule {}
