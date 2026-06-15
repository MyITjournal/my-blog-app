import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redisService: RedisService) {}

  async isAllowed(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const count = await this.redisService.increment(key, windowSeconds);
    return count <= maxRequests;
  }
}
