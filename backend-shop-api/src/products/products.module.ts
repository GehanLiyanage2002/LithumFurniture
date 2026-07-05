import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { WorkshopStockModule } from '../workshop-stock/workshop-stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), forwardRef(() => WorkshopStockModule)],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
