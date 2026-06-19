import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      relations: {
        department: true,
      },
    });
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result as User;
  }

  async create(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const result = await this.userRepository.insert({
      ...createUserDto,
      password: hashedPassword,
    });
    const id = result.identifiers[0].id;
    
    if (createUserDto.email) {
      try {
        await this.emailService.sendWelcomeEmail(
          createUserDto.email,
          createUserDto.full_name,
          createUserDto.password
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    }
    
    return this.findOne(id);
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    const { password, ...updateData } = updateUserDto;
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });
    return { message: 'Password reset successfully' };
  }

  async sendResetEmail(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });
    
    if (user.email) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.full_name,
          tempPassword
        );
        return { 
          message: `Password reset email sent to ${user.email}` 
        };
      } catch (error) {
        return { 
          message: `Failed to send email, but password has been reset. Temporary password: ${tempPassword}` 
        };
      }
    } else {
      return { 
        message: `No email address on file. Temporary password: ${tempPassword}` 
      };
    }
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    await this.userRepository.update(id, { is_active: !user.is_active });
    return this.findOne(id);
  }

  /**
   * ✅ OPTION 1: Create user from WhatsApp with phone-based email generation
   * 
   * Generates unique email from phone number:
   * Phone: +2347037158351 → whatsapp_2347037158351@smartcityalert.com
   */
  async createFromWhatsApp(data: { phone: string; name: string; role?: string }): Promise<User> {
    // Check if user already exists by phone
    const existingUser = await this.userRepository.findOne({ 
      where: { phone: data.phone } 
    });
    
    if (existingUser) {
      return existingUser;
    }
    
    // Generate unique email from phone number (remove non-numeric characters)
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
    const generatedEmail = `whatsapp_${cleanPhone}@smartcityalert.com`;
    
    // Generate a random password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Insert the new user
    const result = await this.userRepository.insert({
      phone: data.phone,
      full_name: data.name,
      email: generatedEmail,
      role: data.role || 'resident',
      is_active: true,
      password: hashedPassword,
    });
    
    const id = result.identifiers[0].id;
    const newUser = await this.findOne(id);
    
    // Optional: Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        generatedEmail,
        data.name,
        tempPassword
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the user creation if email fails
    }
    
    return newUser;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { phone },
      relations: {
        department: true,
      },
    });
    return user || null;
  }

  /**
   * Find or create user from WhatsApp
   */
  async findOrCreateFromWhatsApp(phone: string, name?: string): Promise<User> {
    let user = await this.findByPhone(phone);
    
    if (!user) {
      user = await this.createFromWhatsApp({
        phone: phone,
        name: name || `WhatsApp User ${phone.slice(-4)}`,
        role: 'resident',
      });
    }
    //return
    return user;
  }
}