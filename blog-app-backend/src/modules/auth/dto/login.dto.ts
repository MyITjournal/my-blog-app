import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
