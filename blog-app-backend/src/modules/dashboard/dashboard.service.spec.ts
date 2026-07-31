import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: Record<string, any>;
  let redis: Record<string, any>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { count: jest.fn(), findMany: jest.fn() },
      post: { count: jest.fn(), findMany: jest.fn() },
      comment: { count: jest.fn() },
      category: { count: jest.fn(), findMany: jest.fn() },
      tag: { count: jest.fn() },
      newsletterSubscriber: { count: jest.fn() },
    };

    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue(true);
  });

  // ─── getOverview ────────────────────────────────────────────────────────────

  describe('getOverview', () => {
    it('aggregates counts across users, posts, comments, categories, tags, and newsletter', async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.post.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15) // published
        .mockResolvedValueOnce(5); // draft
      prisma.comment.count.mockResolvedValue(30);
      prisma.category.count.mockResolvedValue(4);
      prisma.tag.count.mockResolvedValue(8);
      prisma.newsletterSubscriber.count.mockResolvedValue(100);

      const result = await service.getOverview();

      expect(result).toEqual({
        users: { total: 10 },
        posts: { total: 20, published: 15, draft: 5 },
        comments: { total: 30 },
        categories: { total: 4 },
        tags: { total: 8 },
        newsletter: { subscribers: 100 },
      });
    });

    it('returns the cached value without hitting the database when present', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ users: { total: 999 } }));

      const result = await service.getOverview();

      expect(result).toEqual({ users: { total: 999 } });
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('writes the computed overview back to the cache', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.post.count.mockResolvedValue(0);
      prisma.comment.count.mockResolvedValue(0);
      prisma.category.count.mockResolvedValue(0);
      prisma.tag.count.mockResolvedValue(0);
      prisma.newsletterSubscriber.count.mockResolvedValue(0);

      await service.getOverview();

      expect(redis.set).toHaveBeenCalledWith(
        'dashboard:overview',
        expect.any(String),
        60,
      );
    });
  });

  // ─── getPostsPerCategory ────────────────────────────────────────────────────

  describe('getPostsPerCategory', () => {
    it('maps categories to their post counts', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Tech', slug: 'tech', _count: { posts: 3 } },
      ]);
      prisma.post.count.mockResolvedValue(0);

      const result = await service.getPostsPerCategory();

      expect(result).toEqual([
        { id: 'cat-1', name: 'Tech', slug: 'tech', postCount: 3 },
      ]);
    });

    it('appends an Uncategorized bucket when posts without a category exist', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(7);

      const result = await service.getPostsPerCategory();

      expect(result).toEqual([
        { id: null, name: 'Uncategorized', slug: null, postCount: 7 },
      ]);
    });

    it('omits the Uncategorized bucket when every post has a category', async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Tech', slug: 'tech', _count: { posts: 3 } },
      ]);
      prisma.post.count.mockResolvedValue(0);

      const result = await service.getPostsPerCategory();

      expect(result).not.toContainEqual(
        expect.objectContaining({ name: 'Uncategorized' }),
      );
    });
  });

  // ─── getRecentPosts / getRecentUsers ────────────────────────────────────────

  describe('getRecentPosts', () => {
    it('queries non-deleted posts ordered by newest first with the given limit', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await service.getRecentPosts(10);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      );
    });

    it('defaults the limit to 5', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await service.getRecentPosts();

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('getRecentUsers', () => {
    it('queries non-deleted users ordered by newest first with the given limit', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getRecentUsers(10);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      );
    });
  });

  // ─── getGrowth ──────────────────────────────────────────────────────────────

  describe('getGrowth', () => {
    it('counts new users, posts, and comments created in the last 7 days', async () => {
      prisma.user.count.mockResolvedValue(2);
      prisma.post.count.mockResolvedValue(4);
      prisma.comment.count.mockResolvedValue(6);

      const result = await service.getGrowth();

      expect(result).toEqual({
        sinceDays: 7,
        newUsers: 2,
        newPosts: 4,
        newComments: 6,
      });

      const userWhere = prisma.user.count.mock.calls[0][0].where;
      expect(userWhere.deletedAt).toBeNull();
      expect(userWhere.createdAt.gte).toBeInstanceOf(Date);
    });
  });
});
