'use client';

import React, { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  APPROVAL_REQUEST: FileText,
  APPROVAL_GRANTED: CheckCircle,
  APPROVAL_REJECTED: AlertTriangle,
  PROJECT_DELAYED: AlertTriangle,
  IPC_SUBMITTED: FileText,
  IPC_APPROVED: CheckCircle,
  CONTRACT_AMENDMENT: FileText,
  GENERAL: Info,
};

const typeColors: Record<string, string> = {
  APPROVAL_REQUEST: 'bg-blue-100 text-blue-800',
  APPROVAL_GRANTED: 'bg-green-100 text-green-800',
  APPROVAL_REJECTED: 'bg-red-100 text-red-800',
  PROJECT_DELAYED: 'bg-red-100 text-red-800',
  IPC_SUBMITTED: 'bg-purple-100 text-purple-800',
  IPC_APPROVED: 'bg-green-100 text-green-800',
  CONTRACT_AMENDMENT: 'bg-amber-100 text-amber-800',
  GENERAL: 'bg-gray-100 text-gray-800',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({ page: 1, limit: 50 });
      setNotifications(response.data.data);
      setMeta(response.data.meta);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      showToast('All notifications marked as read', 'success');
      loadNotifications();
    } catch {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {meta?.unreadCount || 0} unread notifications
          </p>
        </div>
        {meta?.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, idx) => {
                const Icon = typeIcons[notification.type] || Info;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''} ${idx < notifications.length - 1 ? 'border-b' : ''}`}
                    onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  >
                    <div className={`rounded-lg p-2 shrink-0 ${typeColors[notification.type] || 'bg-gray-100'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
