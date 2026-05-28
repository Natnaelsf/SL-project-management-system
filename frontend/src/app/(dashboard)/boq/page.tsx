'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { boqApi, projectsApi, contractorsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, getStatusColor } from '@/lib/utils';

const unitOptions = [
  { value: 'Pcs', label: 'Pieces (Pcs)' },
  { value: 'Meters', label: 'Meters' },
  { value: 'Sq.m', label: 'Square Meters (Sq.m)' },
  { value: 'Cu.m', label: 'Cubic Meters (Cu.m)' },
  { value: 'Kg', label: 'Kilograms (Kg)' },
  { value: 'Lump', label: 'Lump Sum' },
  { value: 'Hour', label: 'Hours' },
  { value: 'Day', label: 'Days' },
];

export default function BoqPage() {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [contractorList, setContractorList] = useState<any[]>([]);
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await boqApi.getAll(query);
      setItems(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load BOQ items', 'error');
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

  useEffect(() => { loadItems(); }, [loadItems]);

  const openCreate = async () => {
    await loadFormData();
    setEditingItem(null);
    setFormValues({ itemCode: '', description: '', unit: 'Pcs', quantity: 0, unitPrice: 0, projectId: '', contractorId: '' });
    setShowModal(true);
  };

  const openEdit = async (item: any) => {
    await loadFormData();
    setEditingItem(item);
    setFormValues({
      itemCode: item.itemCode || '',
      description: item.description || '',
      unit: item.unit || 'Pcs',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      projectId: item.projectId || '',
      contractorId: item.contractorId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await boqApi.update(editingItem.id, formValues);
        showToast('BOQ item updated', 'success');
      } else {
        await boqApi.create(formValues);
        showToast('BOQ item created', 'success');
      }
      setShowModal(false);
      loadItems();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (!confirm('Are you sure?')) return;
    try {
      await boqApi.delete(editingItem.id);
      showToast('BOQ item deleted', 'success');
      setShowModal(false);
      loadItems();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const columns = [
    { key: 'itemCode', header: 'Item Code' },
    { key: 'description', header: 'Description', className: 'max-w-xs truncate' },
    { key: 'project', header: 'Project', render: (item: any) => item.project?.name || '-' },
    { key: 'unit', header: 'Unit' },
    { key: 'quantity', header: 'Quantity', render: (item: any) => Number(item.quantity).toLocaleString() },
    { key: 'unitPrice', header: 'Unit Price', render: (item: any) => formatCurrency(item.unitPrice) },
    { key: 'totalPrice', header: 'Total', render: (item: any) => formatCurrency(item.totalPrice) },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bill of Quantities (BOQ)</h1>
        <p className="text-muted-foreground">Manage BOQ items, quantities, and unit prices</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadItems}
        onAdd={canManage ? openCreate : undefined}
        addLabel="Add BOQ Item"
        searchPlaceholder="Search BOQ items..."
      />

      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit BOQ Item' : 'Create BOQ Item'}
        fields={[
          { name: 'itemCode', label: 'Item Code', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'projectId', label: 'Project', type: 'select', required: true, options: projects.map((p: any) => ({ value: p.id, label: p.name })) },
          { name: 'contractorId', label: 'Contractor', type: 'select', options: contractorList.map((c: any) => ({ value: c.id, label: c.name })) },
          { name: 'unit', label: 'Unit', type: 'select', options: unitOptions },
          { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
          { name: 'unitPrice', label: 'Unit Price (ETB)', type: 'number', required: true, min: 0 },
        ]}
        values={formValues}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        onDelete={canManage ? handleDelete : undefined}
        isEditing={!!editingItem}
        size="lg"
      />
    </div>
  );
}
