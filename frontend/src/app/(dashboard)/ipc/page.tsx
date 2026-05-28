'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ipcApi, projectsApi, contractorsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function IpcPage() {
  const [ipcs, setIpcs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIpc, setEditingIpc] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER');

  const loadIpcs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ipcApi.getAll(query);
      setIpcs(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load IPC payments', 'error');
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
    } catch {}
  };

  useEffect(() => { loadIpcs(); }, [loadIpcs]);

  const openCreate = async () => {
    await loadFormData();
    setEditingIpc(null);
    setFormValues({ amount: 0, certifiedAmount: 0, description: '', projectId: '', contractorId: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ipcApi.create(formValues);
      showToast('IPC payment created', 'success');
      setShowModal(false);
      loadIpcs();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await ipcApi.updateStatus(id, { status });
      showToast(`IPC status updated to ${status}`, 'success');
      loadIpcs();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const columns = [
    { key: 'ipcNumber', header: 'IPC #' },
    { key: 'project', header: 'Project', render: (item: any) => item.project?.name || '-' },
    { key: 'contractor', header: 'Contractor', render: (item: any) => item.contractor?.name || '-' },
    { key: 'amount', header: 'Amount', render: (item: any) => formatCurrency(item.amount) },
    { key: 'certifiedAmount', header: 'Certified', render: (item: any) => formatCurrency(item.certifiedAmount) },
    { key: 'netAmount', header: 'Net Amount', render: (item: any) => formatCurrency(item.netAmount) },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge variant="outline" className={getStatusColor(item.status)}>{item.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-1">
          {item.status === 'DRAFT' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'SUBMITTED'); }}>
              Submit
            </Button>
          )}
          {item.status === 'SUBMITTED' && hasRole('SUPER_ADMIN', 'CONTRACT_ENGINEER') && (
            <>
              <Button variant="ghost" size="sm" className="text-green-600" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'VERIFIED'); }}>
                Verify
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'REJECTED'); }}>
                Reject
              </Button>
            </>
          )}
          {item.status === 'VERIFIED' && hasRole('SUPER_ADMIN', 'DIRECTOR') && (
            <Button variant="ghost" size="sm" className="text-blue-600" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'CERTIFIED'); }}>
              Certify
            </Button>
          )}
          {item.status === 'CERTIFIED' && hasRole('SUPER_ADMIN', 'FINANCE_OFFICER') && (
            <Button variant="ghost" size="sm" className="text-emerald-600" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(item.id, 'PAID'); }}>
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">IPC Payments</h1>
        <p className="text-muted-foreground">Interim Payment Certificates - manage payment milestones</p>
      </div>

      <DataTable
        columns={columns}
        data={ipcs}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadIpcs}
        onAdd={canManage ? openCreate : undefined}
        addLabel="New IPC"
        searchPlaceholder="Search IPC..."
      />

      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create IPC Payment"
        fields={[
          { name: 'projectId', label: 'Project', type: 'select', required: true, options: projects.map((p: any) => ({ value: p.id, label: p.name })) },
          { name: 'contractorId', label: 'Contractor', type: 'select', required: true, options: contractorList.map((c: any) => ({ value: c.id, label: c.name })) },
          { name: 'amount', label: 'Amount (ETB)', type: 'number', required: true, min: 0 },
          { name: 'certifiedAmount', label: 'Certified Amount', type: 'number', min: 0 },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        values={formValues}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        isEditing={false}
      />
    </div>
  );
}
