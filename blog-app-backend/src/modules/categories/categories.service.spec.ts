import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockCategoryRow = {
  id: 'cat-uuid-001',
  name: 'Technology',
  slug: 'technology',
  deletedAt: null,
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    const mockPrisma = {
      category: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a category with a slugified name', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategoryRow);

      const result = await service.create({ name: 'Technology' });

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Technology',
            slug: 'technology',
          }),
        }),
      );
      expect(result).toMatchObject({ name: 'Technology', slug: 'technology' });
    });

    it('creates a category with a custom slug', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({
        ...mockCategoryRow,
        slug: 'tech',
      });

      const result = await service.create({ name: 'Technology', slug: 'tech' });

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'tech' }),
        }),
      );
      expect(result.slug).toBe('tech');
    });

    it('throws ConflictException when name produces an empty slug', async () => {
      await expect(service.create({ name: '!!!' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    it('appends a random suffix when slug already exists', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategoryRow); // slug taken
      prisma.category.create.mockResolvedValue({
        ...mockCategoryRow,
        slug: 'technology-abc123',
      });

      const result = await service.create({ name: 'Technology' });

      expect(result.slug).toMatch(/^technology-/);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all non-deleted categories ordered by name', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategoryRow]);

      const result = await service.list();

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'Technology' });
    });

    it('returns an empty array when there are no categories', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });
});
