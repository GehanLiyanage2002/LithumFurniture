import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    // Seed the database with the admin user if it doesn't exist
    await this.usersService.seedAdminUser();
  }
}
