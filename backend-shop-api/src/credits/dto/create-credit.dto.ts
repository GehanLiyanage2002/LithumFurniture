import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCreditDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nic: string;

  @IsString()
  @IsNotEmpty()
  mobile1: string;

  @IsString()
  @IsNotEmpty()
  mobile2: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  productPrice: number;

  @IsNumber()
  downPayment: number;

  @IsNumber()
  interestRate: number;

  @IsNumber()
  months: number;

  @IsNumber()
  totalPayment: number;

  @IsNumber()
  monthlyInstallment: number;

  @IsOptional()
  @IsString()
  nicFrontImageHash?: string;

  @IsOptional()
  @IsString()
  nicRearImageHash?: string;
}
