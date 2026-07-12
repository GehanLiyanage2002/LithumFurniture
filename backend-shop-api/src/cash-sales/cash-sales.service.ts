import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashSale } from './cash-sale.entity';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/product.entity';

@Injectable()
export class CashSalesService {
  constructor(
    @InjectRepository(CashSale)
    private cashSalesRepository: Repository<CashSale>,
    private productsService: ProductsService,
  ) {}

  async create(data: Partial<CashSale>): Promise<CashSale> {
    let totalCost = 0;
    
    // Find product to get cost price and check stock
    if (data.productName && data.quantity) {
      const allProducts = await this.productsService.findAll();
      const product = allProducts.find(p => p.productName === data.productName);
      if (product) {
        if (product.quantity < data.quantity) {
          throw new BadRequestException(`Product '${data.productName}' does not have enough stock. Available: ${product.quantity}, Requested: ${data.quantity}`);
        }
        totalCost = Number(product.costPrice || 0) * data.quantity;
      }
    }

    const saleData = { ...data, totalCost };
    const sale = this.cashSalesRepository.create(saleData);
    const saved = await this.cashSalesRepository.save(sale);
    
    // Decrease stock by the quantity sold
    if (data.productName && data.quantity) {
      // ProductsService needs a method to decrease stock by N quantity
      await this.productsService.decreaseStockByNameQuantity(data.productName, data.quantity);
    }
    
    return saved;
  }

  async findAll(): Promise<CashSale[]> {
    return this.cashSalesRepository.find({ order: { createdAt: 'DESC' } });
  }
}
