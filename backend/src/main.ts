import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(compression());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  app.enableCors({
    origin: ['http://localhost:8080', 'http://localhost:3001'],
    credentials: true,
  });
  
  app.useWebSocketAdapter(new IoAdapter(app));
  
  await app.listen(3000);
  console.log('🚀 SmartCityAlert Backend running on port 3000');
  console.log('📊 Department-based workflow system active');
  console.log('🔄 Auto-escalation engine running');
}
bootstrap();
