import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { IncidentsModule } from './incidents/incidents.module';
import { RespondersModule } from './responders/responders.module';
import { EscalationModule } from './escalation/escalation.module';
import { HealthModule } from './health/health.module';
import { UploadsModule } from './uploads/uploads.module';
import { WorkflowModule } from './workflow/workflow.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { Department } from './departments/department.entity';
import { User } from './users/user.entity';
import { Incident } from './incidents/incident.entity';
import { Responder } from './responders/responder.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USER', 'smartcity'),
        password: configService.get('DB_PASSWORD', 'SecurePass123!'),
        database: configService.get('DB_NAME', 'smartcityalert'),
        entities: [Department, User, Incident, Responder],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    IncidentsModule,
    RespondersModule,
    EscalationModule,
    UploadsModule,
    WorkflowModule,
    PermissionsModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
