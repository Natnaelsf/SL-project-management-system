'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { ModalForm } from '@/components/ui/ModalForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth-context';
import { formatDate, getStatusColor } from '@/lib/utils';

const roleOptions = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'CONTRACT_ENGINEER', label: 'Contract Engineer' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'FINANCE_OFFICER', label: 'Finance Officer' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('SUPER_ADMIN', 'DIRECTOR');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll(query);
      setUsers(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormValues({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'PROJECT_MANAGER' });
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormValues({
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role || 'PROJECT_MANAGER',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formValues };
        if (!updateData.password) delete updateData.password;
        await usersApi.update(editingUser.id, updateData);
        showToast('User updated', 'success');
      } else {
        await usersApi.create(formValues);
        showToast('User created', 'success');
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    if (!confirm('Are you sure?')) return;
    try {
      await usersApi.delete(editingUser.id);
      showToast('User deleted', 'success');
      setShowModal(false);
      loadUsers();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    DIRECTOR: 'bg-purple-100 text-purple-800',
    PROJECT_MANAGER: 'bg-blue-100 text-blue-800',
    CONTRACT_ENGINEER: 'bg-cyan-100 text-cyan-800',
    CONSULTANT: 'bg-amber-100 text-amber-800',
    CONTRACTOR: 'bg-green-100 text-green-800',
    FINANCE_OFFICER: 'bg-indigo-100 text-indigo-800',
  };

  const columns = [
    { key: 'firstName', header: 'Name', render: (item: any) => `${item.firstName} ${item.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'role',
      header: 'Role',
      render: (item: any) => (
        <Badge variant="outline" className={roleColors[item.role]}>{item.role?.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: any) => item.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>,
    },
    { key: 'createdAt', header: 'Created', render: (item: any) => formatDate(item.createdAt) },
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
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage system users and roles</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadUsers}
        onAdd={canManage ? openCreate : undefined}
        addLabel="New User"
        searchPlaceholder="Search users..."
      />

      <ModalForm
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
        fields={[
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'text' },
          { name: 'password', label: editingUser ? 'New Password (leave blank to keep)' : 'Password', type: 'password', required: !editingUser },
          { name: 'role', label: 'Role', type: 'select', options: roleOptions },
        ]}
        values={formValues}
        onChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
        onSubmit={handleSubmit}
        onDelete={canManage ? handleDelete : undefined}
        isEditing={!!editingUser}
      />
    </div>
  );
}
