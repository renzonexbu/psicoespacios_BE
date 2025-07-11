import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../common/entities/blog.entity';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  findAll(): Promise<Blog[]> {
    return this.blogRepository.find();
  }

  findOne(id: number): Promise<Blog> {
    return this.blogRepository.findOneBy({ id }) as Promise<Blog>;
  }

  create(data: Partial<Blog>): Promise<Blog> {
    const blog = this.blogRepository.create(data);
    return this.blogRepository.save(blog);
  }

  async update(id: number, data: Partial<Blog>): Promise<Blog> {
    await this.blogRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.blogRepository.delete(id);
  }
} 