import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateContractDto {
  @IsNumber()
  @Min(0)
  contractAmount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  retentionPercent?: number;

  @IsOptional()
  @IsNumber()
  performanceBond?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectId: string;

  @IsString()
  contractorId: string;
}
