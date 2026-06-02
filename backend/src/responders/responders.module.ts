import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RespondersService } from './responders.service';
import { RespondersController } from './responders.controller';
import { Responder } from './responder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Responder])],
  providers: [RespondersService],
  controllers: [RespondersController],
})
export class RespondersModule {}
