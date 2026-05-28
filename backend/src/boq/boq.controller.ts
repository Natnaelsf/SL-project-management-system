import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BoqService } from './boq.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('boq')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER')
  create(@Body() dto: CreateBoqItemDto, @CurrentUser('id') userId: string) {
    return this.boqService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.boqService.findAll(query);
  }

  @Get('project/:projectId/summary')
  getProjectSummary(@Param('projectId') projectId: string) {
    return this.boqService.getProjectSummary(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boqService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER')
  update(@Param('id') id: string, @Body() dto: UpdateBoqItemDto) {
    return this.boqService.update(id, dto);
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  approve(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('comment') comment: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boqService.approve(id, userId, status, comment);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.boqService.softDelete(id);
  }
}
