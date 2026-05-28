import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractDto, userId: string) {
    const count = await this.prisma.contract.count();
    const contractNumber = `CTR-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.contract.create({
      data: {
        contractNumber,
        contractAmount: dto.contractAmount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        retentionPercent: dto.retentionPercent || 10,
        performanceBond: dto.performanceBond,
        description: dto.description,
        projectId: dto.projectId,
        contractorId: dto.contractorId,
        managedById: userId,
      },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
    contractorId?: string;
  }) {
    const { page = 1, limit = 10, search, status, projectId, contractorId } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (contractorId) where.contractorId = contractorId;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, projectId: true } },
          contractor: { select: { id: true, name: true } },
          managedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { amendments: true, variationOrders: true, extensions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        contractor: true,
        managedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        amendments: { orderBy: { date: 'desc' } },
        variationOrders: { orderBy: { date: 'desc' } },
        extensions: { orderBy: { date: 'desc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async update(id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async softDelete(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');

    return this.prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Amendment
  async addAmendment(contractId: string, dto: any) {
    return this.prisma.contractAmendment.create({
      data: {
        amendmentNumber: dto.amendmentNumber,
        description: dto.description,
        amountChange: dto.amountChange,
        approvedBy: dto.approvedBy,
        remarks: dto.remarks,
        contractId,
      },
    });
  }

  // Variation Order
  async addVariationOrder(contractId: string, dto: any) {
    return this.prisma.variationOrder.create({
      data: {
        voNumber: dto.voNumber,
        description: dto.description,
        amountChange: dto.amountChange,
        approvedBy: dto.approvedBy,
        contractId,
      },
    });
  }

  // Extension of Time
  async addExtension(contractId: string, dto: any) {
    return this.prisma.extensionOfTime.create({
      data: {
        extensionNumber: dto.extensionNumber,
        reason: dto.reason,
        daysExtended: dto.daysExtended,
        newEndDate: new Date(dto.newEndDate),
        approvedBy: dto.approvedBy,
        contractId,
      },
    });
  }

  async getAmendments(contractId: string) {
    return this.prisma.contractAmendment.findMany({
      where: { contractId },
      orderBy: { date: 'desc' },
    });
  }

  async getVariationOrders(contractId: string) {
    return this.prisma.variationOrder.findMany({
      where: { contractId },
      orderBy: { date: 'desc' },
    });
  }

  async getExtensions(contractId: string) {
    return this.prisma.extensionOfTime.findMany({
      where: { contractId },
      orderBy: { date: 'desc' },
    });
  }
}
