import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeNewsletterDto {
  @ApiProperty({ example: 'reader@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
