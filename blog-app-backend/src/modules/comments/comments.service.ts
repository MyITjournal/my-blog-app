import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment as PrismaComment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsQueryDto } from './dto/comments-query.dto';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(comment: PrismaComment): CommentEntity {
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async create(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, isPublished: true, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    const created = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        content: dto.content.trim(),
      },
    });

    return this.toEntity(created);
  }

  async listForPost(postId: string, query: CommentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const post = await this.prisma.post.findFirst({
      where: { id: postId, isPublished: true, deletedAt: null },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    const where = {
      postId,
      deletedAt: null as Date | null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: data.map((comment) => this.toEntity(comment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async remove(
    postId: string,
    commentId: string,
    requesterId: string,
  ): Promise<void> {
    const existing = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        postId,
        deletedAt: null,
      },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    const canDelete =
      existing.authorId === requesterId ||
      existing.post.authorId === requesterId;

    if (!canDelete) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }
}
