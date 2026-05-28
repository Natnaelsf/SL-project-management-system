import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData() {
    const now = new Date();

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects,
      onHoldProjects,
      cancelledProjects,
      delayedProjects,
      totalContracts,
      activeContracts,
      totalContractors,
      totalUsers,
      totalDocuments,
      pendingApprovals,
      recentNotifications,
      projectBudget,
      totalIpcAmount,
      totalPaid,
      projectsByStatus,
      recentProjects,
      recentIpcs,
    ] = await Promise.all([
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.project.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { deletedAt: null, status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { deletedAt: null, status: 'PLANNING' } }),
      this.prisma.project.count({ where: { deletedAt: null, status: 'ON_HOLD' } }),
      this.prisma.project.count({ where: { deletedAt: null, status: 'CANCELLED' } }),
      this.prisma.project.count({
        where: {
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          endDate: { lt: now },
        },
      }),
      this.prisma.contract.count({ where: { deletedAt: null } }),
      this.prisma.contract.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.contractor.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.document.count({ where: { deletedAt: null } }),
      this.prisma.approval.count({ where: { status: 'PENDING' } }),
      this.prisma.notification.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.project.aggregate({
        where: { deletedAt: null },
        _sum: { budget: true },
      }),
      this.prisma.ipcPayment.aggregate({
        where: { status: { in: ['APPROVED', 'PAID', 'CERTIFIED'] } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          contractor: { select: { name: true } },
        },
      }),
      this.prisma.ipcPayment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          project: { select: { name: true } },
          contractor: { select: { name: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        onHoldProjects,
        cancelledProjects,
        delayedProjects,
        totalContracts,
        activeContracts,
        totalContractors,
        totalUsers,
        totalDocuments,
        pendingApprovals,
        totalBudget: projectBudget._sum.budget || 0,
        totalIpcAmount: totalIpcAmount._sum.amount || 0,
        totalPaid: totalPaid._sum.amount || 0,
        budgetUtilization: projectBudget._sum.budget
          ? Number(((Number(totalIpcAmount._sum.amount) / Number(projectBudget._sum.budget)) * 100).toFixed(2))
          : 0,
      },
      projectsByStatus: projectsByStatus.map((p) => ({
        name: p.status,
        count: p._count.id,
      })),
      recentProjects,
      recentIpcs,
      recentNotifications,
    };
  }

  async getChartData() {
    // Get monthly project data for charts
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        budget: true,
      },
    });

    // Group by month
    const monthlyMap = new Map<string, { projects: number; budget: number }>();
    monthlyData.forEach((p) => {
      const month = p.createdAt.toISOString().substring(0, 7);
      const existing = monthlyMap.get(month) || { projects: 0, budget: 0 };
      existing.projects++;
      existing.budget += Number(p.budget);
      monthlyMap.set(month, existing);
    });

    const monthlyChartData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        projects: data.projects,
        budget: data.budget,
      }));

    return {
      projectTrends: monthlyChartData,
    };
  }
}
