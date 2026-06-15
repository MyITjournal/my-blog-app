import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, nullable: true, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: 50,
    description: 'Lowercase letters, numbers, underscore and hyphen only',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/)
  username?: string | null;

  @ApiProperty({ required: false, nullable: true, maxLength: 280 })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  photoUrl?: string | null;
}
