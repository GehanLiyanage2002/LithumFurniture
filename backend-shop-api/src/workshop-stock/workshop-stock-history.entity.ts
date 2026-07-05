import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class WorkshopStockHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // 'ADD' | 'TRANSFER'

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  unitPrice: number; // For transfers to shop

  @CreateDateColumn()
  createdAt: Date;
}
