'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { ArrowLeft, Calendar, MapPin, Building2, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    try {
      const response = await projectsApi.getById(params.id as string);
      setProject(response.data);
    } catch {
      // Error
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            {project.isDelayed && (
              <Badge variant="destructive">DELAYED</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{project.projectId}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-lg font-bold">{formatCurrency(project.budget)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contractor</p>
              <p className="text-sm font-medium">{project.contractor?.name || 'Not assigned'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{project.location || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={project.progressPercent} className="h-3 flex-1" />
            <span className="text-xl font-bold">{project.progressPercent}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress History */}
      {project.projectProgress && project.projectProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.projectProgress.map((progress: any) => (
                <div key={progress.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm">{progress.description || 'Progress update'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(progress.reportDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress.progressPercent} className="w-20 h-2" />
                    <span className="text-sm font-medium">{progress.progressPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Data */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contracts ({project._count?.contracts || 0})</CardTitle>
            <Link href={`/contracts?projectId=${project.id}`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {project.contracts?.length > 0 ? (
              <div className="space-y-2">
                {project.contracts.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{contract.contractor?.name}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No contracts</p>
            )}
          </CardContent>
        </Card>

        {/* IPC Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">IPC Payments ({project._count?.ipcPayments || 0})</CardTitle>
            <Link href={`/ipc?projectId=${project.id}`}>
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {project.ipcPayments?.length > 0 ? (
              <div className="space-y-2">
                {project.ipcPayments.map((ipc: any) => (
                  <div key={ipc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{ipc.ipcNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(ipc.amount)}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(ipc.status)}>
                      {ipc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No IPC payments</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
