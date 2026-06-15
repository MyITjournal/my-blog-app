import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '../entities/user.entity';

@Injectable()
export class UserModelAction {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(user: PrismaUser | null): User | null {
    return user as unknown as User | null;
  }

  private whereUnique(
    identifier: Partial<Pick<User, 'id' | 'email' | 'username'>>,
  ): Prisma.UserWhereUniqueInput {
    if (identifier.id) return { id: identifier.id };
    if (identifier.email) return { email: identifier.email };
    if (identifier.username) return { username: identifier.username };
    throw new Error('No valid unique identifier provided for user lookup');
  }

  async get(options: {
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
  }): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: this.whereUnique(options.identifierOptions),
    });
    if (user?.deletedAt) return null;
    return this.toDomain(user);
  }

  async create(options: {
    transactionOptions?: unknown;
    createPayload: Partial<User>;
  }): Promise<User> {
    const created = await this.prisma.user.create({
      data: options.createPayload as Prisma.UserUncheckedCreateInput,
    });
    return created as unknown as User;
  }

  async update(options: {
    transactionOptions?: unknown;
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
    updatePayload: Partial<User>;
  }): Promise<User | null> {
    await this.prisma.user.update({
      where: this.whereUnique(options.identifierOptions),
      data: options.updatePayload as Prisma.UserUncheckedUpdateInput,
    });
    return this.get({ identifierOptions: options.identifierOptions });
  }

  async delete(options: {
    transactionOptions?: unknown;
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
  }): Promise<void> {
    await this.prisma.user.update({
      where: this.whereUnique(options.identifierOptions),
      data: { deletedAt: new Date() },
    });
  }

  async list(options: {
    paginationPayload: { page: number; limit: number };
    order?: { createdAt: 'ASC' | 'DESC' };
  }): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = options.paginationPayload;
    const where: Prisma.UserWhereInput = { deletedAt: null };
    const orderBy: Prisma.UserOrderByWithRelationInput | undefined =
      options.order
        ? {
            createdAt:
              options.order.createdAt === 'ASC'
                ? Prisma.SortOrder.asc
                : Prisma.SortOrder.desc,
          }
        : undefined;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data as unknown as User[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByEmail(email: string): Promise<User | null> {
    return this.get({ identifierOptions: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.get({ identifierOptions: { username } });
  }
}
