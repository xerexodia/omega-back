import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserStatusEnum } from 'src/models/enums';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /* Seed super admin for the back office */
  async seedData() {
    try {
      const superAdmin = await this.userRepo.findOne({
        where: {
          email: 'chouchou@admin.com',
        },
      });
      if (!superAdmin) {
        const newSuperAdmin = this.userRepo.create({
          email: 'chouchou@admin.com',
        });
        await this.userRepo.save(newSuperAdmin);
      }
    } catch (error) {
      this.logger.error(
        'Error seeding admin data',
        error?.message,
        error?.stack,
      );
      throw new Error(error);
    }
  }
}
