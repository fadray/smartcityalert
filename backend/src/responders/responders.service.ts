import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Responder } from './responder.entity';

@Injectable()
export class RespondersService {
  constructor(
    @InjectRepository(Responder)
    private responderRepository: Repository<Responder>,
  ) {}

  async findAll(): Promise<Responder[]> {
    return this.responderRepository.find({
      relations: {
        user: true,
        department: true,
      },
    });
  }
}
