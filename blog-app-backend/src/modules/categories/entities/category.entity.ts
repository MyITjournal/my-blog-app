import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}
