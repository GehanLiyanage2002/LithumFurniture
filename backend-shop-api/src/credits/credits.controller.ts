import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import * as crypto from 'crypto';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  async create(@Body() createCreditDto: CreateCreditDto) {
    return this.creditsService.create(createCreditDto);
  }

  @Get()
  findAll() {
    return this.creditsService.findAll();
  }

  @Post(':id/recalculate')
  recalculate(@Param('id') id: string, @Body('actualMonths') actualMonths: number) {
    return this.creditsService.recalculate(id, actualMonths);
  }

  @Post(':id/pay')
  makePayment(
    @Param('id') id: string, 
    @Body('amount') amount: number,
    @Body('monthsCovered') monthsCovered: number
  ) {
    return this.creditsService.makePayment(id, amount, monthsCovered || 1);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.creditsService.getPayments(id);
  }

  @Get('customer/search/:nic')
  findCustomerByNic(@Param('nic') nic: string) {
    return this.creditsService.findCustomerByNic(nic);
  }

  @Get('customer/history/:nic')
  findCreditHistoryByNic(@Param('nic') nic: string) {
    return this.creditsService.findCreditHistoryByNic(nic);
  }
}
