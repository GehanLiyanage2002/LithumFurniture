import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  nic: string;

  @Column({ default: '' })
  mobile1: string;

  @Column({ default: '' })
  mobile2: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  productPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  downPayment: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number;

  @Column('int')
  months: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPayment: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  monthlyInstallment: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column('int', { default: 0 })
  paymentsMade: number;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ nullable: true })
  nicFrontImageHash: string;

  @Column({ nullable: true })
  nicRearImageHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
