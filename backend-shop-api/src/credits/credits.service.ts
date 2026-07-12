import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
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
    private configService: ConfigService,
  ) {}

  async create(createCreditDto: CreateCreditDto): Promise<Credit> {
    if (createCreditDto.productName) {
      const product = await this.productsService.findByName(createCreditDto.productName);
      if (!product || product.quantity <= 0) {
        throw new BadRequestException(`Product '${createCreditDto.productName}' is out of stock and cannot be purchased.`);
      }
    }

    const credit = this.creditsRepository.create(createCreditDto);
    const saved = await this.creditsRepository.save(credit);
    
    // Decrease stock for raw furniture
    if (createCreditDto.productName) {
      await this.productsService.decreaseStockByName(createCreditDto.productName);
    }
    
    // Send welcome and reminder info SMS
    const phone = saved.mobile1 || saved.mobile2;
    if (phone) {
      const message = `Hi ${saved.firstName},

Thank you for purchasing ${saved.productName} from Lithum Furniture!

Your monthly installment is Rs. ${saved.monthlyInstallment}. We will send you a reminder on this date every month.

Have a great day!`;
      await this.sendSms(phone, message);
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

    const payable = Math.max(0, Number(credit.productPrice) - Number(credit.discount || 0) - Number(credit.downPayment));
    const newTotalPayment = Math.round(payable + (payable * newInterestRate / 100));

    const remainingToPay = newTotalPayment - Number(credit.paidAmount || 0);

    // Record the final settlement payment if they still owe money under the new rate
    if (remainingToPay > 0) {
      const payment = this.paymentRepository.create({ creditId: id, amount: remainingToPay });
      await this.paymentRepository.save(payment);
      credit.paidAmount = newTotalPayment;
      credit.paymentsMade = actualMonths;
    } else if (remainingToPay <= 0) {
      // If remainingToPay is 0 or negative (they already paid enough to cover the new reduced total), 
      // we cap the totalPayment to what they actually paid so Due becomes 0.
      credit.paidAmount = Number(credit.paidAmount || 0);
      credit.paymentsMade = actualMonths;
    }

    credit.months = actualMonths;
    credit.interestRate = newInterestRate;
    credit.totalPayment = newTotalPayment;
    credit.monthlyInstallment = 0;
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
      credit.monthlyInstallment = Math.round(remainingBalance / remainingMonths);
    } else {
      // If remaining months is 0 or less but there is still a balance, they are overdue
      credit.monthlyInstallment = Math.round(remainingBalance);
    }

    return this.creditsRepository.save(credit);
  }

  async getPayments(creditId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { creditId },
      order: { createdAt: 'DESC' },
    });
  }

  @Cron('0 9 * * *') // Runs every day at 9:00 AM
  async handleMonthlyInstallmentReminders() {
    const activeCredits = await this.creditsRepository.find({
      where: { status: 'ACTIVE' },
    });

    const today = new Date();
    const currentDay = today.getDate();

    for (const credit of activeCredits) {
      const purchaseDate = new Date(credit.createdAt);
      
      // Check if it's the exact day of the month as the purchase date
      // Also ensure we don't send it on the very first day of purchase
      if (
        purchaseDate.getDate() === currentDay &&
        (today.getMonth() !== purchaseDate.getMonth() || today.getFullYear() !== purchaseDate.getFullYear())
      ) {
        const message = `Dear ${credit.firstName}, your monthly installment of Rs. ${credit.monthlyInstallment} is due today for ${credit.productName}. Please pay ASAP.`;
        const phone = credit.mobile1 || credit.mobile2;
        
        if (phone) {
          const message = `Hi ${credit.firstName},

A friendly reminder from Lithum Furniture!

Your monthly installment of Rs. ${credit.monthlyInstallment} for ${credit.productName} is due today.

Please make the payment ASAP. Thank you!`;
          await this.sendSms(phone, message);
        }
      }
    }
  }

  async findCustomerByNic(nic: string): Promise<Partial<Credit> | null> {
    const credit = await this.creditsRepository.findOne({
      where: { nic },
      order: { createdAt: 'DESC' },
    });
    
    if (!credit) return null;
    
    return {
      firstName: credit.firstName,
      lastName: credit.lastName,
      nic: credit.nic,
      mobile1: credit.mobile1,
      mobile2: credit.mobile2,
      nicFrontImage: credit.nicFrontImage,
      nicRearImage: credit.nicRearImage,
      customerFaceImage: credit.customerFaceImage,
    };
  }

  async findCreditHistoryByNic(nic: string): Promise<Credit[]> {
    return this.creditsRepository.find({
      where: { nic },
      order: { createdAt: 'DESC' },
    });
  }

  private async sendSms(phone: string, message: string) {
    try {
      let formattedPhone = phone.trim();
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '94' + formattedPhone.slice(1);
      } else if (formattedPhone.startsWith('+94')) {
        formattedPhone = formattedPhone.slice(1);
      }

      const userId = this.configService.get<string>('NOTIFY_USER_ID');
      const apiKey = this.configService.get<string>('NOTIFY_API_KEY');
      const url = `https://app.notify.lk/api/v1/send?user_id=${userId}&api_key=${apiKey}&sender_id=NotifyDEMO&to=${formattedPhone}&message=${encodeURIComponent(message)}`;
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        console.log(`Sent SMS to ${formattedPhone}`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to send SMS to ${formattedPhone}, status: ${response.status}, response: ${errorText}`);
      }
    } catch (error) {
      console.error(`Error sending SMS to ${phone}`, error);
    }
  }
}
