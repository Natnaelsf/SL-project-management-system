import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: string;
    title: string;
    message: string;
    receiverId: string;
    senderId?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type as any,
        title: data.title,
        message: data.message,
        receiverId: data.receiverId,
        senderId: data.senderId,
        link: data.link,
      },
    });
  }

  async findAllForUser(userId: string, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const where: any = { receiverId: userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { receiverId: userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, receiverId: userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}
