import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @ApiProperty({ required: false, maxLength: 180 })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  excerpt?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, description: 'Optional custom slug' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;
}
