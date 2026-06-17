import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CategoryEntity } from './entities/category.entity.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(category: Pick<Category, 'id' | 'name' | 'slug'>): CategoryEntity {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
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

  private async buildUniqueSlug(name: string, customSlug?: string): Promise<string> {
    const base = this.slugify(customSlug && customSlug.length > 0 ? customSlug : name);
    if (!base) {
      throw new ConflictException('Unable to generate a valid category slug');
    }

    const existing = await this.prisma.category.findUnique({
      where: { slug: base },
    });

    if (!existing) {
      return base;
    }

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = await this.buildUniqueSlug(dto.name, dto.slug);

    const created = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
      },
    });

    return this.toEntity(created);
  }

  async list() {
    const data = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return data.map((category) => this.toEntity(category));
  }
}
