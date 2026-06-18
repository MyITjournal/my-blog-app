import { ApiProperty } from '@nestjs/swagger';

export class PostEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ nullable: true })
  excerpt: string | null;

  @ApiProperty({ default: false })
  isPublished: boolean;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  category: { id: string; name: string; slug: string } | null;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  tags: Array<{ id: string; name: string; slug: string }>;
}
