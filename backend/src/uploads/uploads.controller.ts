import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';

@Controller('uploads')
export class UploadsController {
  // ===== PROTECTED ENDPOINT (Admin Dashboard) =====
  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { 
      success: true, 
      url: `/uploads/${file.filename}`, 
      filename: file.filename 
    };
  }

  // ===== PUBLIC ENDPOINT (Public Frontend) =====
  @Post('public')
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads/public',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `public-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadPublicImages(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadedFiles = files.map(file => ({
      url: `/uploads/public/${file.filename}`,
      filename: file.filename,
      path: file.path,
    }));
    
    return {
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    };
  }

  // ===== PUBLIC SINGLE FILE UPLOAD =====
  @Post('public/single')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/public',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `public-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadPublicImage(@UploadedFile() file: Express.Multer.File) {
    return {
      success: true,
      url: `/uploads/public/${file.filename}`,
      filename: file.filename,
      path: file.path,
    };
  }
}
