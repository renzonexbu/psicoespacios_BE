import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/v1/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // Endpoints públicos
  @Get()
  findAll(): Promise<BlogResponseDto[]> {
    return this.blogsService.findAll();
  }

  @Get('search')
  searchBlogs(@Query('q') searchTerm: string): Promise<BlogResponseDto[]> {
    return this.blogsService.searchBlogs(searchTerm);
  }

  @Get('category/:categoria')
  findByCategory(@Param('categoria') categoria: string): Promise<BlogResponseDto[]> {
    return this.blogsService.findByCategory(categoria);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<BlogResponseDto> {
    return this.blogsService.findOne(id);
  }

  // Endpoints protegidos (solo ADMIN)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createBlogDto: CreateBlogDto): Promise<BlogResponseDto> {
    return this.blogsService.create(createBlogDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: number, @Body() updateBlogDto: UpdateBlogDto): Promise<BlogResponseDto> {
    return this.blogsService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: number): Promise<void> {
    return this.blogsService.remove(id);
  }
} 