import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Post } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { PostsQueryDto } from './dto/posts-query.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { PostEntity } from './entities/post.entity.js';

type PostWithRelations = Post & {
  category: { id: string; name: string; slug: string } | null;
  postTags: Array<{ tag: { id: string; name: string; slug: string } }>;
};

const POST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  postTags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(post: PostWithRelations): PostEntity {
    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: post.category,
      tags: post.postTags.map((postTag) => postTag.tag),
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async buildUniqueSlug(
    title: string,
    customSlug?: string,
    options?: { excludePostId?: string },
  ): Promise<string> {
    const base = this.slugify(
      customSlug && customSlug.length > 0 ? customSlug : title,
    );
    if (!base) {
      throw new ConflictException('Unable to generate a valid slug from title');
    }

    const existing = await this.prisma.post.findFirst({
      where: {
        slug: base,
        ...(options?.excludePostId ? { id: { not: options.excludePostId } } : {}),
      },
    });
    if (!existing) return base;

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  private async ensureCategoryExists(categoryId?: string): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private async getValidatedTagIds(tagIds?: string[]): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const uniqueTagIds = [...new Set(tagIds)];
    const foundTags = await this.prisma.tag.findMany({
      where: {
        id: { in: uniqueTagIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (foundTags.length !== uniqueTagIds.length) {
      throw new NotFoundException('One or more tags were not found');
    }

    return uniqueTagIds;
  }

  private buildSortOrder(
    query: PostsQueryDto,
  ): Prisma.PostOrderByWithRelationInput {
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return {
      [sortBy]: sortOrder,
    } as Prisma.PostOrderByWithRelationInput;
  }

  private buildSearchFilter(search?: string): Prisma.PostWhereInput {
    if (!search?.trim()) {
      return {};
    }

    const term = search.trim();
    return {
      OR: [
        { title: { contains: term } },
        { slug: { contains: term } },
        { excerpt: { contains: term } },
        { content: { contains: term } },
      ],
    };
  }

  private buildListWhere(
    query: PostsQueryDto,
    options: { publishedOnly: boolean; authorId?: string },
  ): Prisma.PostWhereInput {
    const filters: Prisma.PostWhereInput[] = [{ deletedAt: null }];

    if (options.publishedOnly || query.status === 'published') {
      filters.push({ isPublished: true });
    } else if (query.status === 'draft') {
      filters.push({ isPublished: false });
    }

    if (options.authorId) {
      filters.push({ authorId: options.authorId });
    } else if (query.authorId) {
      filters.push({ authorId: query.authorId });
    }

    if (query.categoryId) {
      filters.push({ categoryId: query.categoryId });
    }

    if (query.tagId) {
      filters.push({ postTags: { some: { tagId: query.tagId } } });
    }

    const searchFilter = this.buildSearchFilter(query.search);
    if (Object.keys(searchFilter).length > 0) {
      filters.push(searchFilter);
    }

    return filters.length === 1 ? filters[0] : { AND: filters };
  }

  async create(authorId: string, dto: CreatePostDto): Promise<PostEntity> {
    const slug = await this.buildUniqueSlug(dto.title, dto.slug);
    await this.ensureCategoryExists(dto.categoryId);
    const tagIds = await this.getValidatedTagIds(dto.tagIds);

    const created = await this.prisma.post.create({
      data: {
        authorId,
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt ?? null,
        categoryId: dto.categoryId,
        postTags:
          tagIds.length > 0
            ? {
                create: tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
      },
      include: POST_INCLUDE,
    });

    return this.toEntity(created);
  }

  async listPublished(query: PostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildListWhere(query, { publishedOnly: true });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.buildSortOrder(query),
        include: POST_INCLUDE,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map((post) => this.toEntity(post)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listMine(authorId: string, query: PostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildListWhere(query, {
      publishedOnly: false,
      authorId,
    });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.buildSortOrder(query),
        include: POST_INCLUDE,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map((post) => this.toEntity(post)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublishedBySlug(slug: string): Promise<PostEntity> {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException(`Published post with slug ${slug} not found`);
    }

    return this.toEntity(post);
  }

  async findOneForAuthor(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.prisma.post.findFirst({
      where: { id, authorId, deletedAt: null },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return this.toEntity(post);
  }

  async update(
    authorId: string,
    id: string,
    dto: UpdatePostDto,
  ): Promise<PostEntity> {
    const existing = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    await this.ensureCategoryExists(dto.categoryId);
    const tagIds = dto.tagIds
      ? await this.getValidatedTagIds(dto.tagIds)
      : undefined;

    const slug =
      dto.slug || dto.title
        ? await this.buildUniqueSlug(dto.title ?? existing.title, dto.slug, {
            excludePostId: id,
          })
        : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (tagIds) {
        await tx.postTag.deleteMany({ where: { postId: id } });
      }

      return tx.post.update({
        where: { id },
        data: {
          title: dto.title,
          content: dto.content,
          excerpt: dto.excerpt,
          categoryId: dto.categoryId,
          ...(slug ? { slug } : {}),
          ...(tagIds
            ? {
                postTags: {
                  create: tagIds.map((tagId) => ({ tagId })),
                },
              }
            : {}),
        },
        include: POST_INCLUDE,
      });
    });

    return this.toEntity(updated);
  }

  async publish(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.findOneForAuthor(authorId, id);

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { isPublished: true, publishedAt: new Date() },
      include: POST_INCLUDE,
    });

    return this.toEntity(updated);
  }

  async unpublish(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.findOneForAuthor(authorId, id);

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { isPublished: false, publishedAt: null },
      include: POST_INCLUDE,
    });

    return this.toEntity(updated);
  }

  async remove(authorId: string, id: string): Promise<void> {
    const existing = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
