import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PublicService } from './public.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);
  private readonly baseUrl: string;

  constructor(
    private publicService: PublicService,
    private configService: ConfigService,
  ) {
    // ✅ Get base URL from environment
    this.baseUrl = this.configService.get('APP_URL') || 'http://localhost:3001';
    this.logger.log(`Public API base URL: ${this.baseUrl}`);
  }

  @Post('incidents')
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `public-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }))
  @HttpCode(HttpStatus.CREATED)
  async reportIncident(
    @Body() reportData: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.logger.log(`Public incident report received from ${reportData.phone || 'anonymous'}`);
    this.logger.log(`Files received: ${files?.length || 0}`);
    
    try {
      // ✅ Generate full URLs using baseUrl
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        imageUrls = files.map(file => `${this.baseUrl}/uploads/${file.filename}`);
      }
      
      const incident = await this.publicService.createIncidentFromPublic({
        ...reportData,
        images: imageUrls,
      });
      
      return {
        success: true,
        id: incident.id,
        message: 'Incident reported successfully',
        incident: {
          id: incident.id,
          title: incident.title,
          status: incident.status,
          created_at: incident.created_at,
          images: imageUrls,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating public incident: ${error.message}`);
      throw error;
    }
  }

  @Get('incidents/:id')
  async trackIncident(@Param('id') id: string) {
    this.logger.log(`Public tracking request for incident: ${id}`);
    
    try {
      const incident = await this.publicService.getPublicIncident(id);
      return {
        success: true,
        incident,
      };
    } catch (error) {
      this.logger.error(`Error fetching public incident: ${error.message}`);
      throw error;
    }
  }

  @Get('status/:id')
  async getIncidentStatus(@Param('id') id: string) {
    return this.trackIncident(id);
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'SmartCityAlert Public API',
      timestamp: new Date().toISOString(),
    };
  }
}
