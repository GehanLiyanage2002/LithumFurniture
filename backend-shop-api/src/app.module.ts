import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';
import { ProductsModule } from './products/products.module';
import { CashSalesModule } from './cash-sales/cash-sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    // 1. Load the .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // 2. Configure TypeORM with the database URL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Note: Set to false in production!
        ssl: {
          rejectUnauthorized: false, // Required for Supabase connections
        },
      }),
    }),
    
    AuthModule,
    
    UsersModule,

    CreditsModule,
    
    ProductsModule,

    CashSalesModule,

    SuppliersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}