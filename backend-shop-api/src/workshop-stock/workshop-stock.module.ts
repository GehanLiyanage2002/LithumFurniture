import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopStock } from './workshop-stock.entity';
import { WorkshopStockHistory } from './workshop-stock-history.entity';
import { WorkshopStockService } from './workshop-stock.service';
import { WorkshopStockController } from './workshop-stock.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkshopStock, WorkshopStockHistory]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [WorkshopStockController],
  providers: [WorkshopStockService],
  exports: [WorkshopStockService],
})
export class WorkshopStockModule {}
