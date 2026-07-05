import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  costPrice: number;

  @Column('int')
  quantity: number;

  @Column({ default: 'RAW' }) // RAW means shop-made furniture, SUPPLIER means bought from distributor
  category: string;

  @Column({ nullable: true })
  supplierName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
