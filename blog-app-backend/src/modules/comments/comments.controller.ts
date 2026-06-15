import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CommentsService } from './comments.service';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller({ path: 'posts/:postId/comments' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List comments for a published post (paginated)' })
  list(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: CommentsQueryDto,
  ) {
    return this.commentsService.listForPost(postId, query);
  }

  @ApiBearerAuth('JWT')
  @Post()
  @ApiOperation({ summary: 'Add a comment to a published post' })
  create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('sub') authorId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, authorId, dto);
  }

  @ApiBearerAuth('JWT')
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete my comment or a comment on my post' })
  remove(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('sub') requesterId: string,
  ) {
    return this.commentsService.remove(postId, commentId, requesterId);
  }
}
