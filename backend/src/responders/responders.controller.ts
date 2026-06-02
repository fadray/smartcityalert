import { Controller, Get, UseGuards } from '@nestjs/common';
import { RespondersService } from './responders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/responders')
@UseGuards(AuthGuard('jwt'))
export class RespondersController {
  constructor(private respondersService: RespondersService) {}

  @Get()
  findAll() {
    return this.respondersService.findAll();
  }
}
