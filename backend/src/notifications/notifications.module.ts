import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { Notification } from './notification.entity';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Department])],
  providers: [NotificationsService, EmailService, WebsocketGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
