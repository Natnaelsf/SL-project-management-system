'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { contractsApi, projectsApi, contractorsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'AMENDED', label: 'Amended' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER');

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await contractsApi.getAll(query);
      setContracts(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load contracts', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadFormData = async () => {
    try {
      const [projRes, contRes] = await Promise.all([
        projectsApi.getAll({ limit: 100 }),
        contractorsApi.getAllSimple(),
      ]);
      setProjects(projRes.data.data);
      setContractorList(contRes.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const openCreate = async () => {
    await loadFormData();
    setEditingContract(null);
    setFormValues({
      contractAmount: 0,
      startDate: '',
      endDate: '',
      retentionPercent: 10,
      performanceBond: 0,
      description: '',
      projectId: '',
      contractorId: '',
    });
    setShowModal(true);
  };

  const openEdit = async (contract: any) => {
    await loadFormData();
    setEditingContract(contract);
    setFormValues({
      contractAmount: contract.contractAmount || 0,
      startDate: contract.startDate?.split('T')[0] || '',
      endDate: contract.endDate?.split('T')[0] || '',
      retentionPercent: contract.retentionPercent || 10,
      performanceBond: contract.performanceBond || 0,
      description: contract.description || '',
      projectId: contract.projectId || '',
      contractorId: contract.contractorId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await contractsApi.update(editingContract.id, formValues);
        showToast('Contract updated successfully', 'success');
      } else {
        await contractsApi.create(formValues);
        showToast('Contract created successfully', 'success');
      }
      setShowModal(false);
      loadContracts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save contract', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingContract) return;
    if (!confirm('Are you sure?')) return;
    try {
      await contractsApi.delete(editingContract.id);
      showToast('Contract deleted', 'success');
      setShowModal(false);
      loadContracts();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const columns = [
    { key: 'contractNumber', header: 'Contract #' },
    {
      key: 'project',
      header: 'Project',
      render: (item: any) => item.project?.name || '-',
    },
    { key: 'contractor', header: 'Contractor', render: (item: any) => item.contractor?.name || '-' },
    { key: 'contractAmount', header: 'Amount', render: (item: any) => formatCurrency(item.contractAmount) },
    { key: 'retentionPercent', header: 'Retention', render: (item: any) => `${item.retentionPercent}%` },
    { key: 'startDate', header: 'Start', render: (item: any) => formatDate(item.startDate) },
    { key: 'endDate', header: 'End', render: (item: any) => formatDate(item.endDate) },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge>
      ),
    },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (item: any) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(item); }}>Edit</Button>
      ),
    }] : []),
  ];

  const formFields = [
    { name: 'projectId', label: 'Project', type: 'select' as const, required: true, options: projects.map((p: any) => ({ value: p.id, label: p.name })) },
    { name: 'contractorId', label: 'Contractor', type: 'select' as const, required: true, options: contractorList.filter((c: any) => !c.isConsultant).map((c: any) => ({ value: c.id, label: c.name })) },
    { name: 'contractAmount', label: 'Contract Amount (ETB)', type: 'number' as const, required: true, min: 0 },
    { name: 'startDate', label: 'Start Date', type: 'date' as const, required: true },
    { name: 'endDate', label: 'End Date', type: 'date' as const, required: true },
    { name: 'retentionPercent', label: 'Retention %', type: 'number' as const, min: 0 },
    { name: 'performanceBond', label: 'Performance Bond', type: 'number' as const, min: 0 },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground">Manage project contracts, amendments, and variations</p>
      </div>
      <DataTable
        columns={columns}
        data={contracts}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadContracts}
        onAdd={canManage ? openCreate : undefined}
        addLabel="New Contract"
        searchPlaceholder="Search contracts..."
      />
      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingContract ? 'Edit Contract' : 'Create Contract'}
        fields={formFields}
        values={formValues}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        onDelete={canManage ? handleDelete : undefined}
        isEditing={!!editingContract}
        size="lg"
      />
    </div>
  );
}
