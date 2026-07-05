import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  billNo: string;

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

  @Column({ type: 'text', nullable: true })
  nicFrontImage: string;

  @Column({ type: 'text', nullable: true })
  nicRearImage: string;

  @Column({ type: 'text', nullable: true })
  customerFaceImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
