import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { Blog } from '../common/entities/blog.entity';

@Controller('api/v1/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  findAll(): Promise<Blog[]> {
    return this.blogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Blog> {
    return this.blogsService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Blog>): Promise<Blog> {
    return this.blogsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Blog>): Promise<Blog> {
    return this.blogsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.blogsService.remove(id);
  }
} 