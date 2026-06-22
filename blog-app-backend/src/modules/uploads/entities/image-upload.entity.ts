import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadEntity {
  @ApiProperty({ description: 'Public HTTPS URL of the uploaded image' })
  url: string;

  @ApiProperty({ description: 'Cloudinary public ID (use to delete or transform later)' })
  publicId: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty({ example: 'webp' })
  format: string;

  @ApiProperty({ description: 'File size in bytes' })
  bytes: number;
}
