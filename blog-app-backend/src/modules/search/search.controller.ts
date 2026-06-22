import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { Public } from '../../common/decorators/public.decorator';
import {
  NameSlugEntity,
  SearchResultEntity,
} from './entities/search-result.entity';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Search posts',
    description:
      'Search published posts by keyword across title, slug, excerpt and content. Optionally filter by category or tag. Supports pagination. Accessible to everyone including guests.',
  })
  @ApiOkResponse({ type: SearchResultEntity })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async search(@Query() dto: SearchDto) {
    return this.searchService.searchPosts(dto);
  }

  @Public()
  @Get('categories')
  @ApiOperation({
    summary: 'List all categories',
    description:
      'Returns all available categories for use in filtering search results.',
  })
  @ApiOkResponse({ type: [NameSlugEntity] })
  async getCategories() {
    return this.searchService.getCategories();
  }

  @Public()
  @Get('tags')
  @ApiOperation({
    summary: 'List all tags',
    description:
      'Returns all available tags for use in filtering search results.',
  })
  @ApiOkResponse({ type: [NameSlugEntity] })
  async getTags() {
    return this.searchService.getTags();
  }
}
