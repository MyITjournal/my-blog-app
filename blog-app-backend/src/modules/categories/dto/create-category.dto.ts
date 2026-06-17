import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({
    required: false,
    maxLength: 120,
    description: 'Optional custom slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}
