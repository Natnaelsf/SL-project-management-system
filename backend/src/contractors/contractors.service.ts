import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({
      data: dto,
    });
  }

  async findAll(query: { page?: number; limit?: number; search?: string; isConsultant?: boolean; isActive?: boolean }) {
    const { page = 1, limit = 10, search, isConsultant, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isConsultant !== undefined) where.isConsultant = isConsultant;
    if (isActive !== undefined) where.isActive = isActive;

    const [contractors, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { projects: true, contracts: true } },
        },
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return {
      data: contractors,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllSimple() {
    return this.prisma.contractor.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, isConsultant: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      include: {
        projects: {
          where: { deletedAt: null },
          select: { id: true, name: true, projectId: true, status: true },
        },
        contracts: {
          where: { deletedAt: null },
          select: { id: true, contractNumber: true, status: true, contractAmount: true },
        },
        _count: { select: { projects: true, contracts: true, boqItems: true } },
      },
    });

    if (!contractor) throw new NotFoundException('Contractor not found');
    return contractor;
  }

  async update(id: string, dto: UpdateContractorDto) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });
    if (!contractor) throw new NotFoundException('Contractor not found');

    return this.prisma.contractor.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });
    if (!contractor) throw new NotFoundException('Contractor not found');

    return this.prisma.contractor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
