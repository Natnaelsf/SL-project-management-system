import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateBoqItemDto {
  @IsString()
  itemCode: string;

  @IsString()
  description: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  contractorId?: string;
}
