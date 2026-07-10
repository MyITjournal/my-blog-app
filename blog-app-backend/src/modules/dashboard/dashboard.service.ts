import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
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

    return {
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
  }

  async getPostsPerCategory() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { posts: { where: { deletedAt: null } } },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      postCount: category._count.posts,
    }));
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
