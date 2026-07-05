import { Controller, Get, Post, Body } from '@nestjs/common';
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

    return this.creditsService.create(createCreditDto);
  }

  @Get()
  findAll() {
    return this.creditsService.findAll();
  }
}
