import { ApiProperty } from '@nestjs/swagger';

export class TagEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}
