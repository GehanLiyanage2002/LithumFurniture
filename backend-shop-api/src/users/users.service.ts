import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async seedAdminUser(): Promise<void> {
    try {
      const adminExists = await this.usersRepository.findOne({ where: { username: 'admin' } });
      if (!adminExists) {
        this.logger.log('Seeding initial admin user...');
        const passwordHash = await bcrypt.hash('admin123', 10);
        const adminUser = this.usersRepository.create({
          username: 'admin',
          passwordHash,
          role: 'admin',
        });
        await this.usersRepository.save(adminUser);
        this.logger.log('Admin user successfully seeded.');
      }
    } catch (error) {
      this.logger.error('Failed to seed admin user', error);
    }
  }
}
