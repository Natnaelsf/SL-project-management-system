import {
  Controller, Get, Post, Body, Param, Delete, Query, UseGuards,
  UseInterceptors, UploadedFile, Res, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, and images are allowed.'), false);
  }
};

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; description?: string; category?: string; projectId?: string; contractId?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.upload(file, body, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { document, filePath } = await this.documentsService.download(id);
    res.download(filePath, document.fileName);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  remove(@Param('id') id: string) {
    return this.documentsService.softDelete(id);
  }
}
