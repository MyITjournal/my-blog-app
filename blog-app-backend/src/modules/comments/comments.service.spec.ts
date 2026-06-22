import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma/prisma.service';

const authorId = 'user-uuid-001';
const postAuthorId = 'user-uuid-002';
const postId = 'post-uuid-001';
const commentId = 'comment-uuid-001';

const mockCommentRow = {
  id: commentId,
  postId,
  authorId,
  content: 'Great post!',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  post: { authorId: postAuthorId },
};

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    const mockPrisma = {
      post: {
        findFirst: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (arg: unknown) => {
        if (Array.isArray(arg)) return await Promise.all(arg);
        if (typeof arg === 'function') return await arg(prisma);
      },
    );
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { content: 'Great post!' };

    it('throws NotFoundException when post does not exist or is not published', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('creates and returns a comment for a published post', async () => {
      prisma.post.findFirst.mockResolvedValue({ id: postId });
      prisma.comment.create.mockResolvedValue(mockCommentRow);

      const result = await service.create(postId, authorId, dto);

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            postId,
            authorId,
            content: 'Great post!',
          }),
        }),
      );
      expect(result).toMatchObject({ id: commentId, postId, authorId });
    });

    it('trims whitespace from content', async () => {
      prisma.post.findFirst.mockResolvedValue({ id: postId });
      prisma.comment.create.mockResolvedValue({
        ...mockCommentRow,
        content: 'trimmed',
      });

      await service.create(postId, authorId, { content: '  trimmed  ' });

      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'trimmed' }),
        }),
      );
    });
  });

  // ─── listForPost ──────────────────────────────────────────────────────────────

  describe('listForPost', () => {
    it('throws NotFoundException when post does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(service.listForPost(postId, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns paginated comments for a published post', async () => {
      prisma.post.findFirst.mockResolvedValue({ id: postId });
      prisma.comment.findMany.mockResolvedValue([mockCommentRow]);
      prisma.comment.count.mockResolvedValue(1);

      const result = await service.listForPost(postId, { page: 1, limit: 20 });

      expect(result).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ id: commentId }),
        ]),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when comment does not exist', async () => {
      prisma.comment.findFirst.mockResolvedValue(null);

      await expect(service.remove(postId, commentId, authorId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when requester is neither the comment nor post author', async () => {
      prisma.comment.findFirst.mockResolvedValue({
        ...mockCommentRow,
        authorId: 'someone-else',
        post: { authorId: 'also-someone-else' },
      });

      await expect(service.remove(postId, commentId, authorId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows the comment author to delete their own comment', async () => {
      prisma.comment.findFirst.mockResolvedValue(mockCommentRow); // authorId matches
      prisma.comment.update.mockResolvedValue(undefined);

      await expect(
        service.remove(postId, commentId, authorId),
      ).resolves.not.toThrow();

      expect(prisma.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: commentId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('allows the post author to delete any comment on their post', async () => {
      prisma.comment.findFirst.mockResolvedValue({
        ...mockCommentRow,
        authorId: 'commenter-id',
        post: { authorId: postAuthorId }, // postAuthorId making the request
      });
      prisma.comment.update.mockResolvedValue(undefined);

      await expect(
        service.remove(postId, commentId, postAuthorId),
      ).resolves.not.toThrow();

      expect(prisma.comment.update).toHaveBeenCalled();
    });
  });
});
