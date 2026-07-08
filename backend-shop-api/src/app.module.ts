import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';
import { ProductsModule } from './products/products.module';
import { CashSalesModule } from './cash-sales/cash-sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WorkshopStockModule } from './workshop-stock/workshop-stock.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
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

    WorkshopStockModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}