import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contacto } from '../common/entities/contacto.entity';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';

@Injectable()
export class ContactoService {
  constructor(
    @InjectRepository(Contacto)
    private contactoRepository: Repository<Contacto>,
  ) {}

  async create(createContactoDto: CreateContactoDto): Promise<Contacto> {
    const contacto = this.contactoRepository.create(createContactoDto);
    return this.contactoRepository.save(contacto);
  }

  async findAll(): Promise<Contacto[]> {
    return this.contactoRepository.find({
      order: {
        fecha: 'DESC', // Ordena por fecha descendente (más reciente primero)
      },
    });
  }

  async findOne(id: string): Promise<Contacto> {
    const contacto = await this.contactoRepository.findOne({ where: { id } });
    if (!contacto) {
      throw new NotFoundException(`Contacto con ID ${id} no encontrado`);
    }
    return contacto;
  }

  async update(id: string, updateContactoDto: UpdateContactoDto): Promise<Contacto> {
    const contacto = await this.findOne(id);
    const updated = Object.assign(contacto, updateContactoDto);
    return this.contactoRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.contactoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Contacto con ID ${id} no encontrado`);
    }
  }
}
