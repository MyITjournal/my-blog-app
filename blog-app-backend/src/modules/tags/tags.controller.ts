import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { TagsService } from './tags.service.js';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List tags' })
  list() {
    return this.tagsService.list();
  }

  @ApiBearerAuth('JWT')
  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }
}
