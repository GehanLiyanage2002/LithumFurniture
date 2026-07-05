import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productsRepository.create(data);
    return this.productsRepository.save(product);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.productsRepository.save(product);
  }

  async decreaseStockByName(productName: string): Promise<void> {
    return this.decreaseStockByNameQuantity(productName, 1);
  }

  async decreaseStockByNameQuantity(productName: string, quantity: number): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { productName } });
    if (product && product.quantity >= quantity) {
      product.quantity -= quantity;
      await this.productsRepository.save(product);
    } else if (product && product.quantity < quantity) {
      // Just set to 0 if they buy more than what's technically in stock
      product.quantity = 0;
      await this.productsRepository.save(product);
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
