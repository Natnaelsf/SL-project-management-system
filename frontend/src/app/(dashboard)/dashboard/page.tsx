'use client';

import React, { useEffect, useState } from 'react';
import { dashboardApi, projectsApi, ipcApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  FolderKanban,
  Activity,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashResponse] = await Promise.all([
        dashboardApi.getData(),
      ]);
      setData(dashResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = data?.stats;
  const recentProjects = data?.recentProjects || [];
  const recentIpcs = data?.recentIpcs || [];

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: Activity,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Delayed Projects',
      value: stats?.delayedProjects || 0,
      icon: Clock,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
    {
      title: 'Total Budget',
      value: formatCurrency(stats?.totalBudget),
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Active Contracts',
      value: stats?.activeContracts || 0,
      icon: FileText,
      color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
    },
    {
      title: 'Budget Utilization',
      value: `${stats?.budgetUtilization || 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: 'Contractors',
      value: stats?.totalContractors || 0,
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: Users,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to SLPCMS - Street Light Project & Contract Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress & Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Budget</span>
                  <span className="font-medium">{formatCurrency(stats?.totalBudget)}</span>
                </div>
                <Progress value={stats?.budgetUtilization || 0} variant={stats?.budgetUtilization > 80 ? 'warning' : 'default'} />
                <div className="flex justify-between text-sm mt-2 text-muted-foreground">
                  <span>Spent: {formatCurrency(stats?.totalIpcAmount)}</span>
                  <span>{stats?.budgetUtilization || 0}% utilized</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.delayedProjects > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-3">
                  <Clock className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {stats.delayedProjects} project(s) are delayed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Requires immediate attention</p>
                  </div>
                </div>
              )}
              {stats?.pendingApprovals > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950 p-3">
                  <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {stats.pendingApprovals} pending approval(s)
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Waiting for review</p>
                  </div>
                </div>
              )}
              {stats?.delayedProjects === 0 && stats?.pendingApprovals === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No active alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.slice(0, 5).map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{project.projectId}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={project.progressPercent} className="w-20 h-1.5" />
                      <span className="text-xs text-muted-foreground">{project.progressPercent}%</span>
                    </div>
                  </div>
                </Link>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent IPC Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent IPC Payments</CardTitle>
            <Link href="/ipc">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIpcs.slice(0, 5).map((ipc: any) => (
                <div key={ipc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ipc.ipcNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{ipc.project?.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium">{formatCurrency(ipc.amount)}</p>
                    <Badge variant="outline" className={getStatusColor(ipc.status)}>
                      {ipc.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentIpcs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No IPC payments yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
