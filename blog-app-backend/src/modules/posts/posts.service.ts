import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(post: {
    id: string;
    authorId: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PostEntity {
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

  private async buildUniqueSlug(title: string, customSlug?: string) {
    const base = this.slugify(customSlug && customSlug.length > 0 ? customSlug : title);
    if (!base) {
      throw new ConflictException('Unable to generate a valid slug from title');
    }

    const existing = await this.prisma.post.findUnique({ where: { slug: base } });
    if (!existing) return base;

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  async create(authorId: string, dto: CreatePostDto): Promise<PostEntity> {
    const slug = await this.buildUniqueSlug(dto.title, dto.slug);

    const created = await this.prisma.post.create({
      data: {
        authorId,
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt ?? null,
      },
    });

    return this.toEntity(created);
  }

  async listPublished(query: PostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      isPublished: true,
      deletedAt: null,
      ...(query.authorId ? { authorId: query.authorId } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

    const where = {
      authorId,
      deletedAt: null,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    });

    if (!post) {
      throw new NotFoundException(`Published post with slug ${slug} not found`);
    }

    return this.toEntity(post);
  }

  async findOneForAuthor(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.prisma.post.findFirst({
      where: { id, authorId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return this.toEntity(post);
  }

  async update(authorId: string, id: string, dto: UpdatePostDto): Promise<PostEntity> {
    const existing = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    if (existing.authorId !== authorId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    const slug =
      dto.slug || dto.title
        ? await this.buildUniqueSlug(dto.title ?? existing.title, dto.slug)
        : undefined;

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        ...(slug ? { slug } : {}),
      },
    });

    return this.toEntity(updated);
  }

  async publish(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.findOneForAuthor(authorId, id);

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { isPublished: true, publishedAt: new Date() },
    });

    return this.toEntity(updated);
  }

  async unpublish(authorId: string, id: string): Promise<PostEntity> {
    const post = await this.findOneForAuthor(authorId, id);

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { isPublished: false, publishedAt: null },
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
