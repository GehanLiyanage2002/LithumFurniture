import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class CashSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column('varchar', { default: 'NONE' }) // NONE, FIXED, PERCENTAGE
  discountType: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discountValue: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalPrice: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalCost: number;

  @CreateDateColumn()
  createdAt: Date;
}
