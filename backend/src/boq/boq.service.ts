import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';

@Injectable()
export class BoqService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBoqItemDto, userId: string) {
    const totalPrice = dto.quantity * dto.unitPrice;

    return this.prisma.boqItem.create({
      data: {
        itemCode: dto.itemCode,
        description: dto.description,
        unit: dto.unit,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalPrice,
        projectId: dto.projectId,
        contractorId: dto.contractorId,
        createdById: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, search, projectId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { itemCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.boqItem.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, projectId: true } },
          contractor: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.boqItem.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.boqItem.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        contractor: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvals: {
          include: {
            approvedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) throw new NotFoundException('BOQ item not found');
    return item;
  }

  async update(id: string, dto: UpdateBoqItemDto) {
    const item = await this.prisma.boqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('BOQ item not found');

    const data: any = { ...dto };

    // Recalculate total price if quantity or unit price changed
    const newQty = dto.quantity ?? item.quantity;
    const newUnitPrice = dto.unitPrice ?? item.unitPrice;
    data.totalPrice = Number(newQty) * Number(newUnitPrice);

    return this.prisma.boqItem.update({
      where: { id },
      data: { ...data, revision: { increment: 1 } },
      include: {
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async approve(id: string, userId: string, status: string, comment?: string) {
    const item = await this.prisma.boqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('BOQ item not found');

    await this.prisma.boqApproval.create({
      data: {
        boqItemId: id,
        approvedById: userId,
        status: status as any,
        comment,
      },
    });

    return this.prisma.boqItem.update({
      where: { id },
      data: { status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
    });
  }

  async softDelete(id: string) {
    const item = await this.prisma.boqItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('BOQ item not found');

    return this.prisma.boqItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getProjectSummary(projectId: string) {
    const items = await this.prisma.boqItem.findMany({
      where: { projectId, deletedAt: null },
    });

    const totalBudget = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const totalExecuted = items.reduce((sum, item) => sum + Number(item.executedQty) * Number(item.unitPrice), 0);
    const progress = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

    return {
      totalItems: items.length,
      totalBudget,
      totalExecuted,
      progressPercent: Number(progress.toFixed(2)),
    };
  }
}
