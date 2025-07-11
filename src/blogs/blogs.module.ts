import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '../common/entities/blog.entity';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Blog])],
  providers: [BlogsService],
  controllers: [BlogsController],
})
export class BlogsModule {} 