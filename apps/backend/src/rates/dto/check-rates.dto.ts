import { IsString, IsNumber, IsDateString, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckRatesDto {
  @ApiProperty({ example: 'US', description: '2-letter country code' })
  @IsString()
  toCountry: string;

  @ApiProperty({ example: '12345', description: 'FlightGo zipcode ID' })
  @IsString()
  toZipcodeId: string;

  @ApiProperty({ example: 0.5, description: 'Weight in kg' })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiProperty({ example: 'PARCEL', description: 'Package type: PARCEL (Non-Document), DOCUMENT (Document)' })
  @IsString()
  packageType: string;

  @ApiPropertyOptional({ example: '2025-09-10' })
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 'EXPRESS' })
  @IsOptional()
  @IsString()
  shipmentType?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  volumetricWeight?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  signatureRequired?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  specialHandling?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  nonStandardGoods?: boolean;
}
