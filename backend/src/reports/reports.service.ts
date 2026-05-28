import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getProjectProgressReport(query: { projectId?: string; status?: string; fromDate?: string; toDate?: string }) {
    const where: any = { deletedAt: null };

    if (query.projectId) where.id = query.projectId;
    if (query.status) where.status = query.status;

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        contractor: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true } },
        projectProgress: {
          orderBy: { reportDate: 'desc' },
          take: 1,
        },
        _count: { select: { contracts: true, ipcPayments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const now = new Date();
    return projects.map((p) => ({
      ...p,
      isDelayed: p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && new Date(p.endDate) < now,
      daysRemaining: p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
        ? Math.max(0, Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    }));
  }

  async getFinancialReport(query: { projectId?: string; fromDate?: string; toDate?: string }) {
    const projectWhere: any = { deletedAt: null };
    if (query.projectId) projectWhere.id = query.projectId;

    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      include: {
        contractor: { select: { id: true, name: true } },
        ipcPayments: {
          where: { status: { in: ['APPROVED', 'PAID'] } },
          select: { amount: true, certifiedAmount: true, netAmount: true, status: true },
        },
      },
    });

    return projects.map((p) => {
      const totalIpcAmount = p.ipcPayments.reduce((sum, ipc) => sum + Number(ipc.amount), 0);
      const totalCertified = p.ipcPayments.reduce((sum, ipc) => sum + Number(ipc.certifiedAmount || 0), 0);

      return {
        projectId: p.projectId,
        name: p.name,
        budget: p.budget,
        totalIpcAmount,
        totalCertified,
        utilizationPercent: Number(p.budget) > 0 ? Number(((totalCertified / Number(p.budget)) * 100).toFixed(2)) : 0,
        remaining: Number(p.budget) - totalCertified,
        contractor: p.contractor?.name,
      };
    });
  }

  async getContractStatusReport(query: { status?: string; projectId?: string }) {
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.projectId) where.projectId = query.projectId;

    return this.prisma.contract.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        contractor: { select: { id: true, name: true } },
        amendments: { select: { amountChange: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getIpcReport(query: { projectId?: string; contractorId?: string; status?: string; fromDate?: string; toDate?: string }) {
    const where: any = { deletedAt: null };

    if (query.projectId) where.projectId = query.projectId;
    if (query.contractorId) where.contractorId = query.contractorId;
    if (query.status) where.status = query.status;

    return this.prisma.ipcPayment.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        contractor: { select: { id: true, name: true } },
        payments: { select: { amount: true, paymentDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDelayedProjectsReport() {
    const now = new Date();
    const projects = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        endDate: { lt: now },
      },
      include: {
        contractor: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        projectProgress: {
          orderBy: { reportDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return projects.map((p) => ({
      ...p,
      daysDelayed: Math.floor((now.getTime() - new Date(p.endDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getContractorPerformanceReport() {
    const contractors = await this.prisma.contractor.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        projects: {
          where: { deletedAt: null },
          select: { status: true, budget: true, progressPercent: true },
        },
        contracts: {
          where: { deletedAt: null },
          select: { status: true, contractAmount: true },
        },
      },
    });

    return contractors.map((c) => ({
      id: c.id,
      name: c.name,
      totalProjects: c.projects.length,
      activeProjects: c.projects.filter((p) => p.status === 'ACTIVE').length,
      completedProjects: c.projects.filter((p) => p.status === 'COMPLETED').length,
      totalContracts: c.contracts.length,
      activeContracts: c.contracts.filter((ct) => ct.status === 'ACTIVE').length,
      totalBudget: c.projects.reduce((sum, p) => sum + Number(p.budget), 0),
      avgProgress: c.projects.length > 0
        ? Number((c.projects.reduce((sum, p) => sum + p.progressPercent, 0) / c.projects.length).toFixed(2))
        : 0,
    }));
  }
}
