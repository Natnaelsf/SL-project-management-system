import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIpcDto } from './dto/create-ipc.dto';

@Injectable()
export class IpcService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIpcDto, userId: string) {
    const count = await this.prisma.ipcPayment.count();
    const ipcNumber = `IPC-${String(count + 1).padStart(4, '0')}`;

    // Calculate retention
    const contract = await this.prisma.contract.findFirst({
      where: { projectId: dto.projectId, contractorId: dto.contractorId },
    });

    const retentionPercent = contract?.retentionPercent || 10;
    const retentionAmount = (dto.amount * retentionPercent) / 100;
    const netAmount = dto.amount - retentionAmount;

    const ipc = await this.prisma.ipcPayment.create({
      data: {
        ipcNumber,
        amount: dto.amount,
        certifiedAmount: dto.certifiedAmount || dto.amount,
        retentionAmount,
        netAmount,
        description: dto.description,
        projectId: dto.projectId,
        contractorId: dto.contractorId,
        createdById: userId,
      },
      include: {
        project: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });

    // Create IPC quantities if provided
    if (dto.quantities && dto.quantities.length > 0) {
      for (const qty of dto.quantities) {
        await this.prisma.ipcQuantity.create({
          data: {
            ipcPaymentId: ipc.id,
            boqItemId: qty.boqItemId,
            executedQty: qty.executedQty,
            previousQty: qty.previousQty || 0,
            currentQty: qty.currentQty || qty.executedQty,
            unitPrice: qty.unitPrice,
            amount: qty.amount,
          },
        });
      }
    }

    return ipc;
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
      where.OR = [{ ipcNumber: { contains: search, mode: 'insensitive' } }];
    }

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (contractorId) where.contractorId = contractorId;

    const [ipcs, total] = await Promise.all([
      this.prisma.ipcPayment.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, projectId: true } },
          contractor: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { payments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ipcPayment.count({ where }),
    ]);

    return {
      data: ipcs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const ipc = await this.prisma.ipcPayment.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, projectId: true, budget: true },
        },
        contractor: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        verifications: {
          include: {
            verifiedBy: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        ipcQuantities: {
          include: {
            boqItem: { select: { id: true, itemCode: true, description: true, unit: true } },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!ipc) throw new NotFoundException('IPC payment not found');
    return ipc;
  }

  async updateStatus(id: string, status: string, userId: string, comment?: string) {
    const ipc = await this.prisma.ipcPayment.findUnique({ where: { id } });
    if (!ipc) throw new NotFoundException('IPC payment not found');

    // Create verification record
    await this.prisma.ipcVerification.create({
      data: {
        ipcPaymentId: id,
        verifiedById: userId,
        status: status === 'CERTIFIED' || status === 'APPROVED' ? 'APPROVED' : 'PENDING',
        comment,
        verifiedQty: 0,
      },
    });

    const updateData: any = { status };

    if (status === 'CERTIFIED') updateData.certificationDate = new Date();
    if (status === 'PAID') updateData.paymentDate = new Date();
    if (status === 'SUBMITTED') updateData.submissionDate = new Date();

    return this.prisma.ipcPayment.update({
      where: { id },
      data: updateData,
    });
  }

  async verify(id: string, userId: string, dto: { verifiedQty: number; comment?: string }) {
    const ipc = await this.prisma.ipcPayment.findUnique({ where: { id } });
    if (!ipc) throw new NotFoundException('IPC payment not found');

    return this.prisma.ipcVerification.create({
      data: {
        ipcPaymentId: id,
        verifiedById: userId,
        verifiedQty: dto.verifiedQty,
        comment: dto.comment,
        status: 'APPROVED',
      },
    });
  }

  async addPayment(id: string, dto: { amount: number; paymentDate: string; paymentMethod?: string; reference?: string; remarks?: string }) {
    const ipc = await this.prisma.ipcPayment.findUnique({ where: { id } });
    if (!ipc) throw new NotFoundException('IPC payment not found');

    const count = await this.prisma.payment.count();
    const paymentNumber = `PAY-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.payment.create({
      data: {
        paymentNumber,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        remarks: dto.remarks,
        ipcPaymentId: id,
      },
    });
  }

  async getPayments(ipcId: string) {
    return this.prisma.payment.findMany({
      where: { ipcPaymentId: ipcId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async softDelete(id: string) {
    const ipc = await this.prisma.ipcPayment.findUnique({ where: { id } });
    if (!ipc) throw new NotFoundException('IPC payment not found');

    return this.prisma.ipcPayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
