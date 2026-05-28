import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  create(@Body() dto: CreateContractorDto) {
    return this.contractorsService.create(dto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.contractorsService.findAll(query);
  }

  @Get('all')
  findAllSimple() {
    return this.contractorsService.findAllSimple();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'DIRECTOR')
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto) {
    return this.contractorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.contractorsService.softDelete(id);
  }
}
