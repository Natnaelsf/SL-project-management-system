import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    PLANNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    ON_HOLD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    VERIFIED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    CERTIFIED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    TENDER: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    AMENDED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    TERMINATED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    REVISED: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
}
