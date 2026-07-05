import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit } from './credit.entity';
import { CreateCreditDto } from './dto/create-credit.dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private creditsRepository: Repository<Credit>,
  ) {}

  async create(createCreditDto: CreateCreditDto): Promise<Credit> {
    const credit = this.creditsRepository.create(createCreditDto);
    return this.creditsRepository.save(credit);
  }

  async findAll(): Promise<Credit[]> {
    return this.creditsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
