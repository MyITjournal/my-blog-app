import { ApiProperty } from '@nestjs/swagger';

export class CommentEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  postId: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: Date;
}
