import {
  BadRequestException,
  Controller,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ImageUploadEntity } from './entities/image-upload.entity';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const FOLDER_MAP: Record<string, string> = {
  content: 'blog/content',
  avatar: 'blog/avatars',
  general: 'blog/uploads',
};

@ApiTags('uploads')
@ApiBearerAuth('JWT')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image to Cloudinary' })
  @ApiQuery({
    name: 'context',
    required: false,
    enum: ['content', 'avatar', 'general'],
    description:
      'Where the image will be used (determines Cloudinary folder). Defaults to "general".',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: ImageUploadEntity })
  async uploadImage(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Query('context') context?: string,
  ): Promise<ImageUploadEntity> {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}". Allowed: jpeg, png, webp, avif, gif.`,
      );
    }

    if (file.size > MAX_BYTES) {
      throw new BadRequestException(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`,
      );
    }

    const folder = FOLDER_MAP[context ?? ''] ?? FOLDER_MAP.general;

    const result = await this.cloudinary.uploadImage(file.buffer, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }
}
