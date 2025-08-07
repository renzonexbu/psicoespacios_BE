import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../common/entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async findAll(): Promise<BlogResponseDto[]> {
    const blogs = await this.blogRepository.find({
      order: { fecha: 'DESC', id: 'DESC' }
    });
    return blogs.map(blog => this.mapToResponseDto(blog));
  }

  async findOne(id: number): Promise<BlogResponseDto> {
    const blog = await this.blogRepository.findOneBy({ id });
    if (!blog) {
      throw new NotFoundException(`Blog con ID ${id} no encontrado`);
    }
    return this.mapToResponseDto(blog);
  }

  async create(createBlogDto: CreateBlogDto): Promise<BlogResponseDto> {
    // Validar que no exista un blog con el mismo título
    const existingBlog = await this.blogRepository.findOne({
      where: { titulo: createBlogDto.titulo }
    });

    if (existingBlog) {
      throw new BadRequestException('Ya existe un blog con este título');
    }

    // Establecer fecha por defecto si no se proporciona
    const fecha = createBlogDto.fecha || new Date().toISOString().split('T')[0];

    const blog = this.blogRepository.create({
      ...createBlogDto,
      fecha,
      imagen: createBlogDto.imagen || null
    });

    const savedBlog = await this.blogRepository.save(blog);
    return this.mapToResponseDto(savedBlog);
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<BlogResponseDto> {
    const blog = await this.blogRepository.findOneBy({ id });
    if (!blog) {
      throw new NotFoundException(`Blog con ID ${id} no encontrado`);
    }

    // Si se está actualizando el título, verificar que no exista otro blog con el mismo título
    if (updateBlogDto.titulo && updateBlogDto.titulo !== blog.titulo) {
      const existingBlog = await this.blogRepository.findOne({
        where: { titulo: updateBlogDto.titulo }
      });

      if (existingBlog) {
        throw new BadRequestException('Ya existe un blog con este título');
      }
    }

    await this.blogRepository.update(id, updateBlogDto);
    const updatedBlog = await this.blogRepository.findOneBy({ id });
    return this.mapToResponseDto(updatedBlog);
  }

  async remove(id: number): Promise<void> {
    const blog = await this.blogRepository.findOneBy({ id });
    if (!blog) {
      throw new NotFoundException(`Blog con ID ${id} no encontrado`);
    }

    await this.blogRepository.delete(id);
  }

  async findByCategory(categoria: string): Promise<BlogResponseDto[]> {
    const blogs = await this.blogRepository.find({
      where: { categoria },
      order: { fecha: 'DESC', id: 'DESC' }
    });
    return blogs.map(blog => this.mapToResponseDto(blog));
  }

  async searchBlogs(searchTerm: string): Promise<BlogResponseDto[]> {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.titulo ILIKE :searchTerm OR blog.descripcion ILIKE :searchTerm OR blog.contenido ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`
      })
      .orderBy('blog.fecha', 'DESC')
      .addOrderBy('blog.id', 'DESC')
      .getMany();

    return blogs.map(blog => this.mapToResponseDto(blog));
  }

  private mapToResponseDto(blog: Blog): BlogResponseDto {
    return {
      id: blog.id,
      titulo: blog.titulo,
      descripcion: blog.descripcion,
      imagen: blog.imagen,
      fecha: blog.fecha,
      categoria: blog.categoria,
      contenido: blog.contenido
    };
  }
} 