import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  @MaxLength(50, { message: 'First name must not be more than 50 characters.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  @MaxLength(50, { message: 'Last name must not be more than 50 characters.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email address is required.' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(255, { message: 'Email must be at most 255 characters.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    description:
      'Password must be between 8–128 characters and must include at least one uppercase letter, one number, and one special character.',
    example: 'Str0ng!Pass',
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long.',
  })
  @MaxLength(128, {
    message: 'Password must be at most 128 characters long.',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Password must include at least one uppercase letter, one number, and one special character.',
  })
  password: string;
}
