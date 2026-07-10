import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';
import { RecentLimitDto } from './dto/recent-limit.dto';

@ApiTags('dashboard')
@ApiBearerAuth('JWT')
@Roles(UserRole.ADMIN)
@Controller({ path: 'dashboard' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get aggregate site stats (admin only)' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('posts-per-category')
  @ApiOperation({ summary: 'Get post counts grouped by category (admin only)' })
  getPostsPerCategory() {
    return this.dashboardService.getPostsPerCategory();
  }

  @Get('recent-posts')
  @ApiOperation({ summary: 'Get most recently created posts (admin only)' })
  getRecentPosts(@Query() query: RecentLimitDto) {
    return this.dashboardService.getRecentPosts(query.limit);
  }

  @Get('recent-users')
  @ApiOperation({ summary: 'Get most recently registered users (admin only)' })
  getRecentUsers(@Query() query: RecentLimitDto) {
    return this.dashboardService.getRecentUsers(query.limit);
  }
}
