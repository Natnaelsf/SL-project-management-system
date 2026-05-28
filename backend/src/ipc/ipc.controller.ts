import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { IpcService } from './ipc.service';
import { CreateIpcDto } from './dto/create-ipc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ipc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IpcController {
  constructor(private readonly ipcService: IpcService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER')
  create(@Body() dto: CreateIpcDto, @CurrentUser('id') userId: string) {
    return this.ipcService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.ipcService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ipcService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'CONTRACT_ENGINEER', 'FINANCE_OFFICER')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('comment') comment: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ipcService.updateStatus(id, status, userId, comment);
  }

  @Post(':id/verify')
  @Roles('SUPER_ADMIN', 'CONTRACT_ENGINEER')
  verify(
    @Param('id') id: string,
    @Body() dto: { verifiedQty: number; comment?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.ipcService.verify(id, userId, dto);
  }

  @Post(':id/payments')
  @Roles('SUPER_ADMIN', 'FINANCE_OFFICER')
  addPayment(@Param('id') id: string, @Body() dto: any) {
    return this.ipcService.addPayment(id, dto);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.ipcService.getPayments(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.ipcService.softDelete(id);
  }
}
