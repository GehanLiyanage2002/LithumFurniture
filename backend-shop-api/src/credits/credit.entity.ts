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

  @Column()
  mobile1: string;

  @Column()
  mobile2: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  downPayment: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number;

  @Column('int')
  months: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPayment: number;

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyInstallment: number;

  @Column({ nullable: true })
  nicFrontImageHash: string;

  @Column({ nullable: true })
  nicRearImageHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
