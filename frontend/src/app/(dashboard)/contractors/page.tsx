'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { contractorsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContractor, setEditingContractor] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR');

  const loadContractors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await contractorsApi.getAll(query);
      setContractors(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load contractors', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadContractors(); }, [loadContractors]);

  const openCreate = () => {
    setEditingContractor(null);
    setFormValues({ name: '', contactPerson: '', email: '', phone: '', address: '', licenseNumber: '', specialization: '', isConsultant: false });
    setShowModal(true);
  };

  const openEdit = (contractor: any) => {
    setEditingContractor(contractor);
    setFormValues({
      name: contractor.name || '',
      contactPerson: contractor.contactPerson || '',
      email: contractor.email || '',
      phone: contractor.phone || '',
      address: contractor.address || '',
      licenseNumber: contractor.licenseNumber || '',
      specialization: contractor.specialization || '',
      isConsultant: contractor.isConsultant || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContractor) {
        await contractorsApi.update(editingContractor.id, formValues);
        showToast('Contractor updated', 'success');
      } else {
        await contractorsApi.create(formValues);
        showToast('Contractor created', 'success');
      }
      setShowModal(false);
      loadContractors();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingContractor) return;
    if (!confirm('Are you sure?')) return;
    try {
      await contractorsApi.delete(editingContractor.id);
      showToast('Contractor deleted', 'success');
      setShowModal(false);
      loadContractors();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'licenseNumber', header: 'License #' },
    { key: 'specialization', header: 'Specialization' },
    {
      key: 'isConsultant',
      header: 'Type',
      render: (item: any) => item.isConsultant ? <Badge variant="info">Consultant</Badge> : <Badge variant="secondary">Contractor</Badge>,
    },
    { key: 'projects', header: 'Projects', render: (item: any) => item._count?.projects || 0 },
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
        <h1 className="text-2xl font-bold tracking-tight">Contractors & Consultants</h1>
        <p className="text-muted-foreground">Manage contractors and consultants</p>
      </div>

      <DataTable
        columns={columns}
        data={contractors}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadContractors}
        onAdd={canManage ? openCreate : undefined}
        addLabel="New Contractor"
        searchPlaceholder="Search contractors..."
      />

      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingContractor ? 'Edit Contractor' : 'Create Contractor'}
        fields={[
          { name: 'name', label: 'Company Name', type: 'text', required: true },
          { name: 'contactPerson', label: 'Contact Person', type: 'text' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'address', label: 'Address', type: 'text' },
          { name: 'licenseNumber', label: 'License Number', type: 'text' },
          { name: 'specialization', label: 'Specialization', type: 'text' },
          { name: 'isConsultant', label: 'Type', type: 'select', options: [{ value: 'true', label: 'Consultant' }, { value: 'false', label: 'Contractor' }] },
        ]}
        values={{ ...formValues, isConsultant: formValues.isConsultant?.toString() || 'false' }}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: name === 'isConsultant' ? value === 'true' : value }))}
        onSubmit={handleSubmit}
        onDelete={canManage ? handleDelete : undefined}
        isEditing={!!editingContractor}
        size="lg"
      />
    </div>
  );
}
