import { Controller, Get, Post, Body } from '@nestjs/common';
import { CashSalesService } from './cash-sales.service';

@Controller('cash-sales')
export class CashSalesController {
  constructor(private readonly cashSalesService: CashSalesService) {}

  @Post()
  create(@Body() data: any) {
    return this.cashSalesService.create(data);
  }

  @Get()
  findAll() {
    return this.cashSalesService.findAll();
  }
}
