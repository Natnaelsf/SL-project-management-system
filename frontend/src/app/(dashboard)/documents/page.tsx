'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { documentsApi } from '@/lib/api';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Upload, Download, FileIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const categoryColors: Record<string, string> = {
  CONTRACT: 'bg-blue-100 text-blue-800',
  BOQ: 'bg-green-100 text-green-800',
  IPC: 'bg-purple-100 text-purple-800',
  REPORT: 'bg-amber-100 text-amber-800',
  DRAWING: 'bg-cyan-100 text-cyan-800',
  SPECIFICATION: 'bg-indigo-100 text-indigo-800',
  CORRESPONDENCE: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'OTHER', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState<Record<string, any>>({ page: 1, limit: 10 });
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await documentsApi.getAll(query);
      setDocuments(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      showToast('Please select a file', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title || uploadForm.file.name);
      formData.append('category', uploadForm.category);

      await documentsApi.upload(formData);
      showToast('File uploaded successfully', 'success');
      setShowUpload(false);
      setUploadForm({ title: '', category: 'OTHER', file: null });
      loadDocuments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const response = await documentsApi.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Download failed', 'error');
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'fileName', header: 'File Name' },
    {
      key: 'category',
      header: 'Category',
      render: (item: any) => <Badge variant="outline" className={categoryColors[item.category]}>{item.category}</Badge>,
    },
    { key: 'fileSize', header: 'Size', render: (item: any) => `${(item.fileSize / 1024).toFixed(1)} KB` },
    { key: 'version', header: 'Version', render: (item: any) => `v${item.version}` },
    { key: 'uploadedBy', header: 'Uploaded By', render: (item: any) => `${item.uploadedBy?.firstName || ''} ${item.uploadedBy?.lastName || ''}` },
    { key: 'createdAt', header: 'Date', render: (item: any) => formatDate(item.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(item.id, item.fileName); }}>
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Upload and manage project documents</p>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        onSearch={(search) => setQuery((prev) => ({ ...prev, search, page: 1 }))}
        onRefresh={loadDocuments}
        onAdd={() => setShowUpload(true)}
        addLabel="Upload File"
        searchPlaceholder="Search documents..."
      />

      <Dialog open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={uploadForm.title}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Document title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={uploadForm.category}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="CONTRACT">Contract</option>
              <option value="BOQ">BOQ</option>
              <option value="IPC">IPC</option>
              <option value="REPORT">Report</option>
              <option value="DRAWING">Drawing</option>
              <option value="SPECIFICATION">Specification</option>
              <option value="CORRESPONDENCE">Correspondence</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File</label>
            <Input
              type="file"
              onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Allowed: PDF, DOCX, XLSX, Images (max 10MB)</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </div>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
