import { ConflictException, Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { TagEntity } from './entities/tag.entity.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(tag: Pick<Tag, 'id' | 'name' | 'slug'>): TagEntity {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
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
    name: string,
    customSlug?: string,
  ): Promise<string> {
    const base = this.slugify(
      customSlug && customSlug.length > 0 ? customSlug : name,
    );
    if (!base) {
      throw new ConflictException('Unable to generate a valid tag slug');
    }

    const existing = await this.prisma.tag.findUnique({
      where: { slug: base },
    });

    if (!existing) {
      return base;
    }

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  async create(dto: CreateTagDto): Promise<TagEntity> {
    const slug = await this.buildUniqueSlug(dto.name, dto.slug);

    const created = await this.prisma.tag.create({
      data: {
        name: dto.name.trim(),
        slug,
      },
    });

    return this.toEntity(created);
  }

  async list() {
    const data = await this.prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return data.map((tag) => this.toEntity(tag));
  }
}
