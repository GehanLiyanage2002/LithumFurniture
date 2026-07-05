import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopStock } from './workshop-stock.entity';
import { WorkshopStockHistory } from './workshop-stock-history.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WorkshopStockService {
  constructor(
    @InjectRepository(WorkshopStock)
    private workshopStockRepository: Repository<WorkshopStock>,
    @InjectRepository(WorkshopStockHistory)
    private historyRepository: Repository<WorkshopStockHistory>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
  ) {}

  async findAll(): Promise<WorkshopStock[]> {
    return this.workshopStockRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<WorkshopStock>): Promise<WorkshopStock> {
    // Check if stock with same name exists
    let stock = await this.workshopStockRepository.findOne({ where: { productName: data.productName } });
    if (stock) {
      stock.quantity += (data.quantity || 0);
      stock = await this.workshopStockRepository.save(stock);
    } else {
      stock = this.workshopStockRepository.create(data);
      stock = await this.workshopStockRepository.save(stock);
    }

    // Log history
    await this.historyRepository.save({
      action: 'ADD',
      productName: stock.productName,
      quantity: data.quantity || 0,
    });

    return stock;
  }

  async findOne(id: string): Promise<WorkshopStock> {
    const stock = await this.workshopStockRepository.findOne({ where: { id } });
    if (!stock) {
      throw new NotFoundException('Workshop stock not found');
    }
    return stock;
  }

  async update(id: string, data: Partial<WorkshopStock>): Promise<WorkshopStock> {
    const stock = await this.findOne(id);
    Object.assign(stock, data);
    return this.workshopStockRepository.save(stock);
  }

  async transferToShop(id: string, transferData: { quantity: number; unitPrice: number }): Promise<void> {
    const stock = await this.findOne(id);
    if (stock.quantity < transferData.quantity) {
      throw new BadRequestException('Insufficient workshop stock quantity');
    }

    // Deduct quantity
    stock.quantity -= transferData.quantity;
    await this.workshopStockRepository.save(stock);

    // Log history
    await this.historyRepository.save({
      action: 'TRANSFER',
      productName: stock.productName,
      quantity: transferData.quantity,
      unitPrice: transferData.unitPrice,
    });

    // Add to shop stock (products)
    const existingProduct = await this.productsService.findByName(stock.productName);

    if (existingProduct) {
      await this.productsService.update(existingProduct.id, {
        quantity: existingProduct.quantity + transferData.quantity,
        unitPrice: transferData.unitPrice, 
      });
    } else {
      await this.productsService.create({
        productName: stock.productName,
        quantity: transferData.quantity,
        unitPrice: transferData.unitPrice,
        costPrice: 0, 
        category: 'RAW'
      });
    }
  }

  async transferByName(productName: string, quantity: number, unitPrice: number): Promise<void> {
    const stock = await this.workshopStockRepository.findOne({ where: { productName } });
    if (!stock) {
      throw new BadRequestException(`Product '${productName}' not found in workshop stock`);
    }
    if (stock.quantity < quantity) {
      throw new BadRequestException(`Insufficient workshop stock for '${productName}'. Available: ${stock.quantity}`);
    }
    
    stock.quantity -= quantity;
    await this.workshopStockRepository.save(stock);

    await this.historyRepository.save({
      action: 'TRANSFER',
      productName: stock.productName,
      quantity,
      unitPrice,
    });
  }

  async remove(id: string): Promise<void> {
    const stock = await this.findOne(id);
    await this.workshopStockRepository.remove(stock);
  }

  async getHistory() {
    return this.historyRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getHistorySummary() {
    const history = await this.historyRepository.find();
    
    let totalAdded = 0;
    let totalTransferred = 0;

    history.forEach(record => {
      if (record.action === 'ADD') {
        totalAdded += record.quantity;
      } else if (record.action === 'TRANSFER') {
        totalTransferred += record.quantity;
      }
    });

    return {
      totalAdded,
      totalTransferred,
    };
  }
}
