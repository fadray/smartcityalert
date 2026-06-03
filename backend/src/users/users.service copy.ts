import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      relations: {
        department: true,
      },
    });
    // Remove passwords from response
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async create(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const result = await this.userRepository.insert({
      ...createUserDto,
      password: hashedPassword,
    });
    const id = result.identifiers[0].id;
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found after creation');
    }
    // Create a new object without the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}
