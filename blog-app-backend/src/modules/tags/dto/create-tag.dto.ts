import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({
    required: false,
    maxLength: 80,
    description: 'Optional custom slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;
}
