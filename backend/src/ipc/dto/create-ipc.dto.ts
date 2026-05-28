import { IsString, IsOptional, IsNumber, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IpcQuantityDto {
  @IsString()
  boqItemId: string;

  @IsNumber()
  @Min(0)
  executedQty: number;

  @IsOptional()
  @IsNumber()
  previousQty?: number;

  @IsOptional()
  @IsNumber()
  currentQty?: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateIpcDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  certifiedAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectId: string;

  @IsString()
  contractorId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IpcQuantityDto)
  quantities?: IpcQuantityDto[];
}
