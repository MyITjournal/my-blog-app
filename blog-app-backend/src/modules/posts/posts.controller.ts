import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller({ path: 'posts', version: '1' })
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiBearerAuth('JWT')
  @Post()
  @ApiOperation({ summary: 'Create a draft post' })
  create(@CurrentUser('sub') authorId: string, @Body() dto: CreatePostDto) {
    return this.postsService.create(authorId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published posts (paginated)' })
  listPublished(@Query() query: PostsQueryDto) {
    return this.postsService.listPublished(query);
  }

  @ApiBearerAuth('JWT')
  @Get('me')
  @ApiOperation({ summary: 'List my posts (paginated)' })
  listMine(@CurrentUser('sub') authorId: string, @Query() query: PostsQueryDto) {
    return this.postsService.listMine(authorId, query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get one published post by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findPublishedBySlug(slug);
  }

  @ApiBearerAuth('JWT')
  @Get(':id')
  @ApiOperation({ summary: 'Get one of my posts by id' })
  findOne(
    @CurrentUser('sub') authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOneForAuthor(authorId, id);
  }

  @ApiBearerAuth('JWT')
  @Patch(':id')
  @ApiOperation({ summary: 'Update one of my posts' })
  update(
    @CurrentUser('sub') authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(authorId, id, dto);
  }

  @ApiBearerAuth('JWT')
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish one of my posts' })
  publish(
    @CurrentUser('sub') authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.publish(authorId, id);
  }

  @ApiBearerAuth('JWT')
  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish one of my posts' })
  unpublish(
    @CurrentUser('sub') authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.unpublish(authorId, id);
  }

  @ApiBearerAuth('JWT')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of my posts' })
  remove(
    @CurrentUser('sub') authorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.remove(authorId, id);
  }
}
