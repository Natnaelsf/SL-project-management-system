import React from 'react';
import { Dialog } from './dialog';
import { Button } from './button';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'password';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
}

interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: Field[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  loading?: boolean;
  isEditing?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ModalForm({
  open,
  onClose,
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  onDelete,
  loading,
  isEditing,
  size = 'md',
}: ModalFormProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size={size}>
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <input
                type={field.type || 'text'}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                min={field.min}
              />
            )}
          </div>
        ))}

        <div className="flex items-center justify-between pt-4">
          <div>
            {isEditing && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
