'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { projectsApi, contractorsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const statusOptions = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'TENDER', label: 'Tender' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [contractors, setContractors] = useState<any[]>([]);
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectsApi.getAll(query);
      setProjects(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadContractors = async () => {
    try {
      const response = await contractorsApi.getAllSimple();
      setContractors(response.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openCreate = async () => {
    await loadContractors();
    setEditingProject(null);
    setFormValues({
      name: '',
      description: '',
      budget: 0,
      startDate: '',
      endDate: '',
      status: 'PLANNING',
      location: '',
      contractorId: '',
      consultantId: '',
      assignedToId: '',
    });
    setShowModal(true);
  };

  const openEdit = async (project: any) => {
    await loadContractors();
    setEditingProject(project);
    setFormValues({
      name: project.name || '',
      description: project.description || '',
      budget: project.budget || 0,
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      status: project.status || 'PLANNING',
      location: project.location || '',
      contractorId: project.contractorId || '',
      consultantId: project.consultantId || '',
      assignedToId: project.assignedToId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectsApi.update(editingProject.id, formValues);
        showToast('Project updated successfully', 'success');
      } else {
        await projectsApi.create(formValues);
        showToast('Project created successfully', 'success');
      }
      setShowModal(false);
      loadProjects();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save project', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectsApi.delete(editingProject.id);
      showToast('Project deleted successfully', 'success');
      setShowModal(false);
      loadProjects();
    } catch {
      showToast('Failed to delete project', 'error');
    }
  };

  const columns = [
    { key: 'projectId', header: 'Project ID' },
    {
      key: 'name',
      header: 'Name',
      render: (item: any) => (
        <Link href={`/projects/${item.id}`} className="font-medium hover:text-primary transition-colors">
          {item.name}
        </Link>
      ),
    },
    { key: 'contractor', header: 'Contractor', render: (item: any) => item.contractor?.name || '-' },
    { key: 'budget', header: 'Budget', render: (item: any) => formatCurrency(item.budget) },
    { key: 'startDate', header: 'Start Date', render: (item: any) => formatDate(item.startDate) },
    { key: 'endDate', header: 'End Date', render: (item: any) => formatDate(item.endDate) },
    {
      key: 'progressPercent',
      header: 'Progress',
      render: (item: any) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={item.progressPercent} className="h-2" />
          <span className="text-xs text-muted-foreground w-8">{item.progressPercent}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
          {item.isDelayed && (
            <Badge variant="destructive" className="text-[10px] px-1">DELAYED</Badge>
          )}
        </div>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
          Edit
        </Button>
      ),
    }] : []),
  ];

  const formFields = [
    { name: 'name', label: 'Project Name', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const },
    { name: 'budget', label: 'Budget (ETB)', type: 'number' as const, required: true, min: 0 },
    { name: 'startDate', label: 'Start Date', type: 'date' as const, required: true },
    { name: 'endDate', label: 'End Date', type: 'date' as const, required: true },
    { name: 'status', label: 'Status', type: 'select' as const, options: statusOptions },
    { name: 'location', label: 'Location', type: 'text' as const },
    { name: 'contractorId', label: 'Contractor', type: 'select' as const, options: contractors.filter(c => !c.isConsultant).map(c => ({ value: c.id, label: c.name })) },
    { name: 'consultantId', label: 'Consultant', type: 'select' as const, options: contractors.filter(c => c.isConsultant).map(c => ({ value: c.id, label: c.name })) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage street light infrastructure projects</p>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadProjects}
        onAdd={canManage ? openCreate : undefined}
        addLabel="New Project"
        searchPlaceholder="Search projects..."
        onRowClick={(item) => window.open(`/projects/${item.id}`, '_self')}
      />

      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? 'Edit Project' : 'Create Project'}
        fields={formFields}
        values={formValues}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        onDelete={canManage ? handleDelete : undefined}
        isEditing={!!editingProject}
      />
    </div>
  );
}
