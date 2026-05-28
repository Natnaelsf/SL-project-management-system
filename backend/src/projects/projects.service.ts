import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string) {
    // Generate project ID
    const count = await this.prisma.project.count();
    const projectId = `SLP-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.project.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        budget: dto.budget,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status || 'PLANNING',
        location: dto.location,
        createdById: userId,
        assignedToId: dto.assignedToId,
        contractorId: dto.contractorId,
        consultantId: dto.consultantId,
      },
      include: {
        contractor: true,
        consultant: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    contractorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, status, contractorId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectId: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (contractorId) where.contractorId = contractorId;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          contractor: { select: { id: true, name: true } },
          consultant: { select: { id: true, name: true } },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { contracts: true, boqItems: true, ipcPayments: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.project.count({ where }),
    ]);

    // Check for delayed projects
    const now = new Date();
    const projectsWithDelay = projects.map((project) => ({
      ...project,
      isDelayed: project.status !== 'COMPLETED' && project.status !== 'CANCELLED' && new Date(project.endDate) < now,
    }));

    return {
      data: projectsWithDelay,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        contractor: true,
        consultant: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contracts: {
          include: {
            contractor: { select: { id: true, name: true } },
          },
        },
        boqItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        ipcPayments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        projectProgress: {
          orderBy: { reportDate: 'desc' },
          take: 5,
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { contracts: true, boqItems: true, ipcPayments: true, documents: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        contractor: true,
        consultant: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async softDelete(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateProgress(id: string, progressPercent: number, description?: string, userId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.projectProgress.create({
      data: {
        projectId: id,
        progressPercent,
        description,
        reportedById: userId,
      },
    });

    return this.prisma.project.update({
      where: { id },
      data: { progressPercent },
    });
  }

  async getDelayedProjects() {
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
      },
      orderBy: { endDate: 'asc' },
    });

    return projects.map((p) => ({
      ...p,
      daysDelayed: Math.floor((now.getTime() - new Date(p.endDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getDashboardStats() {
    const [totalProjects, activeProjects, completedProjects, delayedProjects, totalBudget, totalSpent] =
      await Promise.all([
        this.prisma.project.count({ where: { deletedAt: null } }),
        this.prisma.project.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.project.count({ where: { deletedAt: null, status: 'COMPLETED' } }),
        this.prisma.project.count({
          where: {
            deletedAt: null,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            endDate: { lt: new Date() },
          },
        }),
        this.prisma.project.aggregate({
          where: { deletedAt: null },
          _sum: { budget: true },
        }),
        this.prisma.ipcPayment.aggregate({
          where: { status: { in: ['APPROVED', 'PAID'] } },
          _sum: { netAmount: true },
        }),
      ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalBudget: totalBudget._sum.budget || 0,
      totalSpent: totalSpent._sum.netAmount || 0,
      budgetUtilization: totalBudget._sum.budget
        ? Number(((Number(totalSpent._sum.netAmount) / Number(totalBudget._sum.budget)) * 100).toFixed(2))
        : 0,
    };
  }
}
