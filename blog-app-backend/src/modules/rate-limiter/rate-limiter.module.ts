import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../../common/redis/redis.module';
import { RateLimiterService } from './rate-limiter.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
