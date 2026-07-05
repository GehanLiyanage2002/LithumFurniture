import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { Credit } from './credit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Credit])],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
