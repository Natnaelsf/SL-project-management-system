'use client';

import React, { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Download, FileText, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

type ReportTab = 'progress' | 'financial' | 'contracts' | 'ipc' | 'delayed' | 'performance';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('progress');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'progress':
          response = await reportsApi.getProjectProgress();
          break;
        case 'financial':
          response = await reportsApi.getFinancial();
          break;
        case 'contracts':
          response = await reportsApi.getContractStatus();
          break;
        case 'ipc':
          response = await reportsApi.getIpc();
          break;
        case 'delayed':
          response = await reportsApi.getDelayedProjects();
          break;
        case 'performance':
          response = await reportsApi.getContractorPerformance();
          break;
      }
      setData(response?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'progress' as ReportTab, label: 'Project Progress', icon: TrendingUp },
    { id: 'financial' as ReportTab, label: 'Financial', icon: FileText },
    { id: 'contracts' as ReportTab, label: 'Contract Status', icon: FileText },
    { id: 'ipc' as ReportTab, label: 'IPC Payments', icon: FileText },
    { id: 'delayed' as ReportTab, label: 'Delayed Projects', icon: AlertTriangle },
    { id: 'performance' as ReportTab, label: 'Contractor Performance', icon: Building2 },
  ];

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (data.length === 0) {
      return <p className="text-center py-12 text-muted-foreground">No data available</p>;
    }

    switch (activeTab) {
      case 'progress':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.contractor?.name || '-'}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progressPercent} className="w-20 h-2" />
                      <span className="text-xs">{item.progressPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(item.endDate)}</TableCell>
                  <TableCell>{item.daysRemaining > 0 ? `${item.daysRemaining} days` : 'Overdue'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'financial':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Total IPC</TableHead>
                <TableHead>Certified</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatCurrency(item.budget)}</TableCell>
                  <TableCell>{formatCurrency(item.totalIpcAmount)}</TableCell>
                  <TableCell>{formatCurrency(item.totalCertified)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.utilizationPercent} className="w-16 h-2" variant={item.utilizationPercent > 90 ? 'warning' : 'default'} />
                      <span className="text-xs">{item.utilizationPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.remaining)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'contracts':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retention</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.contractNumber}</TableCell>
                  <TableCell>{item.project?.name || '-'}</TableCell>
                  <TableCell>{item.contractor?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(item.contractAmount)}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge></TableCell>
                  <TableCell>{item.retentionPercent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'ipc':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IPC #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.ipcNumber}</TableCell>
                  <TableCell>{item.project?.name || '-'}</TableCell>
                  <TableCell>{item.contractor?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{formatCurrency(item.netAmount)}</TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge></TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'delayed':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Original End Date</TableHead>
                <TableHead>Days Delayed</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-red-600">{item.name}</TableCell>
                  <TableCell>{item.contractor?.name || '-'}</TableCell>
                  <TableCell>{formatDate(item.endDate)}</TableCell>
                  <TableCell><Badge variant="destructive">{item.daysDelayed} days</Badge></TableCell>
                  <TableCell>
                    <Progress value={item.progressPercent} variant="danger" className="w-20 h-2" />
                    <span className="text-xs ml-2">{item.progressPercent}%</span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'performance':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor</TableHead>
                <TableHead>Total Projects</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Avg Progress</TableHead>
                <TableHead>Total Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.totalProjects}</TableCell>
                  <TableCell>{item.activeProjects}</TableCell>
                  <TableCell>{item.completedProjects}</TableCell>
                  <TableCell>
                    <Progress value={item.avgProgress} className="w-16 h-2" />
                    <span className="text-xs ml-2">{item.avgProgress}%</span>
                  </TableCell>
                  <TableCell>{formatCurrency(item.totalBudget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view project reports</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base capitalize">
            {tabs.find((t) => t.id === activeTab)?.label} Report
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadReport}>
            <Download className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>{renderReport()}</CardContent>
      </Card>
    </div>
  );
}
