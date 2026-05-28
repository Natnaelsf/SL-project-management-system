import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('project-progress')
  getProjectProgressReport(@Query() query: any) {
    return this.reportsService.getProjectProgressReport(query);
  }

  @Get('financial')
  getFinancialReport(@Query() query: any) {
    return this.reportsService.getFinancialReport(query);
  }

  @Get('contract-status')
  getContractStatusReport(@Query() query: any) {
    return this.reportsService.getContractStatusReport(query);
  }

  @Get('ipc')
  getIpcReport(@Query() query: any) {
    return this.reportsService.getIpcReport(query);
  }

  @Get('delayed-projects')
  getDelayedProjectsReport() {
    return this.reportsService.getDelayedProjectsReport();
  }

  @Get('contractor-performance')
  getContractorPerformanceReport() {
    return this.reportsService.getContractorPerformanceReport();
  }
}
