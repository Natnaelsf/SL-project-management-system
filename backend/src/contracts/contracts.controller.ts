import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  create(@Body() dto: CreateContractDto, @CurrentUser('id') userId: string) {
    return this.contractsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.contractsService.softDelete(id);
  }

  // Amendments
  @Post(':id/amendments')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  addAmendment(@Param('id') id: string, @Body() dto: any) {
    return this.contractsService.addAmendment(id, dto);
  }

  @Get(':id/amendments')
  getAmendments(@Param('id') id: string) {
    return this.contractsService.getAmendments(id);
  }

  // Variation Orders
  @Post(':id/variations')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  addVariation(@Param('id') id: string, @Body() dto: any) {
    return this.contractsService.addVariationOrder(id, dto);
  }

  @Get(':id/variations')
  getVariations(@Param('id') id: string) {
    return this.contractsService.getVariationOrders(id);
  }

  // Extensions
  @Post(':id/extensions')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER')
  addExtension(@Param('id') id: string, @Body() dto: any) {
    return this.contractsService.addExtension(id, dto);
  }

  @Get(':id/extensions')
  getExtensions(@Param('id') id: string) {
    return this.contractsService.getExtensions(id);
  }
}
