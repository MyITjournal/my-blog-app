import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserModelAction {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async get(options: {
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
  }): Promise<User | null> {
    return this.repo.findOne({
      where: options.identifierOptions as FindOptionsWhere<User>,
    });
  }

  async create(options: {
    transactionOptions?: unknown;
    createPayload: Partial<User>;
  }): Promise<User> {
    const entity = this.repo.create(options.createPayload);
    return this.repo.save(entity);
  }

  async update(options: {
    transactionOptions?: unknown;
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
    updatePayload: Partial<User>;
  }): Promise<User | null> {
    await this.repo.update(
      options.identifierOptions as FindOptionsWhere<User>,
      options.updatePayload,
    );
    return this.get({ identifierOptions: options.identifierOptions });
  }

  async delete(options: {
    transactionOptions?: unknown;
    identifierOptions: Partial<Pick<User, 'id' | 'email' | 'username'>>;
  }): Promise<void> {
    await this.repo.softDelete(options.identifierOptions as FindOptionsWhere<User>);
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
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: options.order,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByEmail(email: string): Promise<User | null> {
    return this.get({ identifierOptions: { email } });
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.get({ identifierOptions: { username } });
  }
}
