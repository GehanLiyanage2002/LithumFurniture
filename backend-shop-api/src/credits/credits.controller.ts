import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import * as crypto from 'crypto';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  async create(@Body() createCreditDto: CreateCreditDto) {
    // Basic hash for pseudo-security if front/rear images are passed as base64
    if (createCreditDto.nicFrontImageHash) {
      createCreditDto.nicFrontImageHash = crypto.createHash('sha256').update(createCreditDto.nicFrontImageHash).digest('hex');
    }
    if (createCreditDto.nicRearImageHash) {
      createCreditDto.nicRearImageHash = crypto.createHash('sha256').update(createCreditDto.nicRearImageHash).digest('hex');
    }
    if (createCreditDto.customerFaceImage) {
      createCreditDto.customerFaceHash = crypto.createHash('sha256').update(createCreditDto.customerFaceImage).digest('hex');
      delete createCreditDto.customerFaceImage; // Ensure the raw image isn't saved to DB
    }

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
}
