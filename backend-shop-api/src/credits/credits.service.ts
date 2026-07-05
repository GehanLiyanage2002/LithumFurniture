import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit } from './credit.entity';
import { Payment } from './payment.entity';
import { CreateCreditDto } from './dto/create-credit.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private creditsRepository: Repository<Credit>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private productsService: ProductsService,
  ) {}

  async create(createCreditDto: CreateCreditDto): Promise<Credit> {
    const credit = this.creditsRepository.create(createCreditDto);
    const saved = await this.creditsRepository.save(credit);
    
    // Decrease stock for raw furniture
    if (createCreditDto.productName) {
      await this.productsService.decreaseStockByName(createCreditDto.productName);
    }
    
    return saved;
  }

  async findAll(): Promise<Credit[]> {
    return this.creditsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async recalculate(id: string, actualMonths: number): Promise<Credit> {
    const credit = await this.creditsRepository.findOne({ where: { id } });
    if (!credit) throw new Error("Credit not found");

    let newInterestRate = 0;
    if (actualMonths <= 2) newInterestRate = 0;
    else if (actualMonths === 3) newInterestRate = 10;
    else if (actualMonths === 4) newInterestRate = 15;
    else if (actualMonths === 5) newInterestRate = 20;
    else if (actualMonths === 6) newInterestRate = 25;
    else if (actualMonths >= 7) newInterestRate = 35;

    const payable = Number(credit.productPrice) - Number(credit.downPayment);
    const newTotalPayment = payable + (payable * newInterestRate / 100);
    const newMonthlyInstallment = actualMonths > 0 ? newTotalPayment / actualMonths : 0;

    credit.months = actualMonths;
    credit.interestRate = newInterestRate;
    credit.totalPayment = newTotalPayment;
    credit.monthlyInstallment = newMonthlyInstallment;
    credit.status = 'COMPLETED';

    return this.creditsRepository.save(credit);
  }

  async makePayment(creditId: string, amount: number, monthsCovered: number = 1): Promise<Credit> {
    const credit = await this.creditsRepository.findOne({ where: { id: creditId } });
    if (!credit) throw new Error("Credit not found");

    const payment = this.paymentRepository.create({ creditId, amount });
    await this.paymentRepository.save(payment);

    credit.paidAmount = Number(credit.paidAmount || 0) + Number(amount);
    credit.paymentsMade = Number(credit.paymentsMade || 0) + monthsCovered;

    const remainingBalance = Number(credit.totalPayment) - Number(credit.paidAmount);
    const remainingMonths = Number(credit.months) - Number(credit.paymentsMade);

    if (remainingBalance <= 0) {
      credit.status = 'COMPLETED';
      credit.monthlyInstallment = 0;
    } else if (remainingMonths > 0) {
      // Recalculate upcoming monthly payment
      credit.monthlyInstallment = remainingBalance / remainingMonths;
    }

    return this.creditsRepository.save(credit);
  }

  async getPayments(creditId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { creditId },
      order: { createdAt: 'DESC' },
    });
  }
}
