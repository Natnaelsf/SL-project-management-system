import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async upload(
    file: Express.Multer.File,
    dto: { title: string; description?: string; category?: string; projectId?: string; contractId?: string },
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get latest version for this file
    const existingDocs = await this.prisma.document.count({
      where: { fileName: file.originalname },
    });

    return this.prisma.document.create({
      data: {
        title: dto.title || file.originalname,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: (dto.category as any) || 'OTHER',
        version: existingDocs + 1,
        description: dto.description,
        projectId: dto.projectId,
        contractId: dto.contractId,
        uploadedById: userId,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    projectId?: string;
  }) {
    const { page = 1, limit = 10, search, category, projectId } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async download(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return { document, filePath };
  }

  async softDelete(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
