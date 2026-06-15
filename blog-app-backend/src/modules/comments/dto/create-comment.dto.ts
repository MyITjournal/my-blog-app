import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
