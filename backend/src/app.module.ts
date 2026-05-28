import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { BoqModule } from './boq/boq.module';
import { IpcModule } from './ipc/ipc.module';
import { ContractorsModule } from './contractors/contractors.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    // Throttle requests
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL || '60'),
          limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
        },
      ],
    }),
    // Serve uploaded files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    // Application modules
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ContractsModule,
    BoqModule,
    IpcModule,
    ContractorsModule,
    DocumentsModule,
    ReportsModule,
    DashboardModule,
    NotificationsModule,
    AuditLogModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
