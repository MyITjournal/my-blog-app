import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

const authorId = 'author-uuid-001';
const postId = 'post-uuid-001';

const mockPostRow = {
  id: postId,
  authorId,
  title: 'Hello World',
  slug: 'hello-world',
  content: 'Some content',
  excerpt: null,
  isPublished: false,
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  categoryId: null,
  category: null,
  postTags: [],
};

const mockPostEntity = {
  id: postId,
  authorId,
  title: 'Hello World',
  slug: 'hello-world',
  content: 'Some content',
  excerpt: null,
  isPublished: false,
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  category: null,
  tags: [],
};

describe('PostsService', () => {
  let service: PostsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    const mockPrisma = {
      post: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      postTag: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();

    // Default $transaction: array form returns results of each call
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (arg: unknown) => {
        if (Array.isArray(arg)) return await Promise.all(arg);
        if (typeof arg === 'function') return await arg(prisma);
      },
    );
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { title: 'Hello World', content: 'Some content' };

    it('creates and returns a post entity', async () => {
      prisma.post.findFirst.mockResolvedValue(null); // slug available
      prisma.tag.findMany.mockResolvedValue([]);
      prisma.post.create.mockResolvedValue(mockPostRow);

      const result = await service.create(authorId, dto);

      expect(prisma.post.create).toHaveBeenCalled();
      expect(result).toMatchObject({
        title: 'Hello World',
        slug: 'hello-world',
      });
    });

    it('throws ConflictException when title produces an empty slug', async () => {
      await expect(
        service.create(authorId, { title: '!!!', content: 'x' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when categoryId does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create(authorId, { ...dto, categoryId: 'bad-cat' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when a tagId does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);
      prisma.tag.findMany.mockResolvedValue([]); // none found, but 1 requested

      await expect(
        service.create(authorId, { ...dto, tagIds: ['bad-tag'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findPublishedBySlug ──────────────────────────────────────────────────────

  describe('findPublishedBySlug', () => {
    it('returns post entity for a valid published slug', async () => {
      prisma.post.findFirst.mockResolvedValue({
        ...mockPostRow,
        isPublished: true,
      });

      const result = await service.findPublishedBySlug('hello-world');

      expect(result).toMatchObject({ slug: 'hello-world' });
    });

    it('throws NotFoundException when slug is not found', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(service.findPublishedBySlug('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findOneForAuthor ─────────────────────────────────────────────────────────

  describe('findOneForAuthor', () => {
    it('returns post when author and id match', async () => {
      prisma.post.findFirst.mockResolvedValue(mockPostRow);

      const result = await service.findOneForAuthor(authorId, postId);

      expect(result).toMatchObject({ id: postId, authorId });
    });

    it('throws NotFoundException when post is not found', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(
        service.findOneForAuthor(authorId, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when post does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(
        service.update(authorId, postId, { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when requester is not the author', async () => {
      prisma.post.findFirst.mockResolvedValue({
        ...mockPostRow,
        authorId: 'other-author',
      });

      await expect(
        service.update(authorId, postId, { title: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates and returns the post entity', async () => {
      prisma.post.findFirst.mockResolvedValue(mockPostRow);
      prisma.tag.findMany.mockResolvedValue([]);
      prisma.postTag.deleteMany.mockResolvedValue(undefined);
      prisma.post.update.mockResolvedValue({ ...mockPostRow, title: 'New' });

      const result = await service.update(authorId, postId, { title: 'New' });

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result).toMatchObject({ id: postId });
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when post does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(service.remove(authorId, postId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when requester is not the author', async () => {
      prisma.post.findFirst.mockResolvedValue({
        ...mockPostRow,
        authorId: 'other-author',
      });

      await expect(service.remove(authorId, postId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('soft-deletes the post', async () => {
      prisma.post.findFirst.mockResolvedValue(mockPostRow);
      prisma.post.update.mockResolvedValue(undefined);

      await service.remove(authorId, postId);

      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: postId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ─── publish / unpublish ──────────────────────────────────────────────────────

  describe('publish', () => {
    it('sets isPublished=true and publishedAt', async () => {
      prisma.post.findFirst.mockResolvedValue(mockPostRow);
      prisma.post.update.mockResolvedValue({
        ...mockPostRow,
        isPublished: true,
        publishedAt: new Date(),
      });

      const result = await service.publish(authorId, postId);

      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPublished: true }),
        }),
      );
      expect(result.isPublished).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('sets isPublished=false and clears publishedAt', async () => {
      prisma.post.findFirst.mockResolvedValue({
        ...mockPostRow,
        isPublished: true,
      });
      prisma.post.update.mockResolvedValue({
        ...mockPostRow,
        isPublished: false,
        publishedAt: null,
      });

      const result = await service.unpublish(authorId, postId);

      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublished: false,
            publishedAt: null,
          }),
        }),
      );
      expect(result.isPublished).toBe(false);
    });
  });
});
