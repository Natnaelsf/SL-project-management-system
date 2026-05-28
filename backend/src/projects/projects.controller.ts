import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') userId: string) {
    return this.projectsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.projectsService.findAll(query);
  }

  @Get('delayed')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  getDelayedProjects() {
    return this.projectsService.getDelayedProjects();
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  getStats() {
    return this.projectsService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Patch(':id/progress')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'CONTRACT_ENGINEER')
  updateProgress(
    @Param('id') id: string,
    @Body('progressPercent') progressPercent: number,
    @Body('description') description: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.updateProgress(id, progressPercent, description, userId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.projectsService.softDelete(id);
  }
}
