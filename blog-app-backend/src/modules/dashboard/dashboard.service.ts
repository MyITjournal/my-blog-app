import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../common/redis/redis.service';

const OVERVIEW_CACHE_KEY = 'dashboard:overview';
const POSTS_PER_CATEGORY_CACHE_KEY = 'dashboard:posts-per-category';
const CACHE_TTL_SECONDS = 60;

type DashboardOverview = {
  users: { total: number };
  posts: { total: number; published: number; draft: number };
  comments: { total: number };
  categories: { total: number };
  tags: { total: number };
  newsletter: { subscribers: number };
};

type CategoryPostCount = {
  id: string | null;
  name: string;
  slug: string | null;
  postCount: number;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOverview(): Promise<DashboardOverview> {
    const cached = await this.redis.get(OVERVIEW_CACHE_KEY);
    if (cached) return JSON.parse(cached) as DashboardOverview;

    const [
      totalUsers,
      totalPosts,
      publishedPosts,
      draftPosts,
      totalComments,
      totalCategories,
      totalTags,
      newsletterSubscribers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.post.count({
        where: { deletedAt: null, isPublished: true },
      }),
      this.prisma.post.count({
        where: { deletedAt: null, isPublished: false },
      }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.category.count({ where: { deletedAt: null } }),
      this.prisma.tag.count({ where: { deletedAt: null } }),
      this.prisma.newsletterSubscriber.count(),
    ]);

    const overview = {
      users: { total: totalUsers },
      posts: {
        total: totalPosts,
        published: publishedPosts,
        draft: draftPosts,
      },
      comments: { total: totalComments },
      categories: { total: totalCategories },
      tags: { total: totalTags },
      newsletter: { subscribers: newsletterSubscribers },
    };

    await this.redis.set(
      OVERVIEW_CACHE_KEY,
      JSON.stringify(overview),
      CACHE_TTL_SECONDS,
    );

    return overview;
  }

  async getPostsPerCategory(): Promise<CategoryPostCount[]> {
    const cached = await this.redis.get(POSTS_PER_CATEGORY_CACHE_KEY);
    if (cached) return JSON.parse(cached) as CategoryPostCount[];

    const [categories, uncategorizedCount] = await Promise.all([
      this.prisma.category.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { posts: { where: { deletedAt: null } } },
          },
        },
      }),
      this.prisma.post.count({
        where: { deletedAt: null, categoryId: null },
      }),
    ]);

    const result = [
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        postCount: category._count.posts,
      })),
      ...(uncategorizedCount > 0
        ? [
            {
              id: null,
              name: 'Uncategorized',
              slug: null,
              postCount: uncategorizedCount,
            },
          ]
        : []),
    ];

    await this.redis.set(
      POSTS_PER_CATEGORY_CACHE_KEY,
      JSON.stringify(result),
      CACHE_TTL_SECONDS,
    );

    return result;
  }

  async getGrowth() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [newUsers, newPosts, newComments] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.post.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.comment.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
    ]);

    return {
      sinceDays: 7,
      newUsers,
      newPosts,
      newComments,
    };
  }

  async getRecentPosts(limit = 5) {
    return this.prisma.post.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getRecentUsers(limit = 5) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
