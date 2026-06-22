import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchDto {
  @ApiProperty({
    description:
      'Search term to match against post title, slug, excerpt and content',
    example: 'nestjs prisma',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q?: string;

  @ApiProperty({
    description: 'Filter by category ID',
    example: 'uuid-of-category',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Filter by tag ID',
    example: 'uuid-of-tag',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiProperty({
    description: 'Page number (starts at 1)',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of results per page (max 50)',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
