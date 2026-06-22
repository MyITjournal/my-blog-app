import { ApiProperty } from '@nestjs/swagger';

export class SearchAuthorEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Jane', nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Doe', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;
}

export class SearchCategoryEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend' })
  name: string;
}

export class SearchTagEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'NestJS' })
  name: string;
}

export class SearchPostTagEntity {
  @ApiProperty({ type: () => SearchTagEntity })
  tag: SearchTagEntity;
}

export class SearchPostEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Getting Started with NestJS' })
  title: string;

  @ApiProperty({ example: 'getting-started-with-nestjs' })
  slug: string;

  @ApiProperty({ example: 'A beginner guide to NestJS', nullable: true })
  excerpt: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: () => SearchAuthorEntity })
  author: SearchAuthorEntity;

  @ApiProperty({ type: () => SearchCategoryEntity, nullable: true })
  category: SearchCategoryEntity | null;

  @ApiProperty({ type: () => [SearchPostTagEntity] })
  postTags: SearchPostTagEntity[];
}

export class SearchMetaEntity {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class SearchResultEntity {
  @ApiProperty({ type: () => [SearchPostEntity] })
  data: SearchPostEntity[];

  @ApiProperty({ type: () => SearchMetaEntity })
  meta: SearchMetaEntity;
}

export class NameSlugEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend' })
  name: string;
}
