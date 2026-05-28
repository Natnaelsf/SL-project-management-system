'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ClipboardList,
  DollarSign,
  Building2,
  BarChart3,
  File,
  Users,
  Settings,
  Bell,
  ChevronLeft,
  Lightbulb,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Contracts', href: '/contracts', icon: FileText },
  { label: 'BOQ', href: '/boq', icon: ClipboardList },
  { label: 'IPC Payments', href: '/ipc', icon: DollarSign },
  { label: 'Contractors', href: '/contractors', icon: Building2 },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Documents', href: '/documents', icon: File },
  { label: 'Users', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER'] },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(...item.roles),
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-sidebar-muted px-4', collapsed && 'justify-center')}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Lightbulb className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold">SLPCMS</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Management System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="border-t border-sidebar-muted p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
