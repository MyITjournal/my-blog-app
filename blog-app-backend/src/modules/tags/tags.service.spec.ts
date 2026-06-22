import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockTagRow = {
  id: 'tag-uuid-001',
  name: 'NestJS',
  slug: 'nestjs',
  deletedAt: null,
};

describe('TagsService', () => {
  let service: TagsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    const mockPrisma = {
      tag: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a tag with a slugified name', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      prisma.tag.create.mockResolvedValue(mockTagRow);

      const result = await service.create({ name: 'NestJS' });

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'NestJS', slug: 'nestjs' }),
        }),
      );
      expect(result).toMatchObject({ name: 'NestJS', slug: 'nestjs' });
    });

    it('creates a tag with a custom slug', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      prisma.tag.create.mockResolvedValue({ ...mockTagRow, slug: 'nest' });

      const result = await service.create({ name: 'NestJS', slug: 'nest' });

      expect(prisma.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'nest' }),
        }),
      );
      expect(result.slug).toBe('nest');
    });

    it('throws ConflictException when name produces an empty slug', async () => {
      await expect(service.create({ name: '!!!' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.tag.create).not.toHaveBeenCalled();
    });

    it('appends a random suffix when slug already exists', async () => {
      prisma.tag.findUnique.mockResolvedValue(mockTagRow); // slug taken
      prisma.tag.create.mockResolvedValue({
        ...mockTagRow,
        slug: 'nestjs-abc123',
      });

      const result = await service.create({ name: 'NestJS' });

      expect(result.slug).toMatch(/^nestjs-/);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all non-deleted tags ordered by name', async () => {
      prisma.tag.findMany.mockResolvedValue([mockTagRow]);

      const result = await service.list();

      expect(prisma.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'NestJS' });
    });

    it('returns an empty array when there are no tags', async () => {
      prisma.tag.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });
});
