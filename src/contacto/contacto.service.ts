import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contacto, ContactoEstado } from '../common/entities/contacto.entity';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';
import { ResponderContactoDto } from './dto/responder-contacto.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactoService {
  constructor(
    @InjectRepository(Contacto)
    private contactoRepository: Repository<Contacto>,
    private mailService: MailService,
  ) {}

  async create(createContactoDto: CreateContactoDto): Promise<Contacto> {
    const contacto = this.contactoRepository.create(createContactoDto);
    const contactoGuardado = await this.contactoRepository.save(contacto);
    
    // Enviar email de confirmación automáticamente
    try {
      await this.enviarEmailConfirmacion(contactoGuardado);
      console.log(`✅ Email de confirmación enviado a: ${contacto.email}`);
    } catch (error) {
      console.error(`❌ Error enviando email de confirmación: ${error.message}`);
      // No fallar la operación principal si el email falla
    }
    
    return contactoGuardado;
  }

  async findAll(): Promise<Contacto[]> {
    return this.contactoRepository.find({
      order: {
        createdAt: 'DESC', // Ordena por fecha de creación descendente (más reciente primero)
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

  async responder(id: string, responderContactoDto: ResponderContactoDto): Promise<Contacto> {
    const contacto = await this.findOne(id);
    
    // Guardar estado anterior para comparar
    const estadoAnterior = contacto.estado;
    
    // Actualizar respuesta y fecha de respuesta
    contacto.respuesta = responderContactoDto.respuesta;
    contacto.fechaRespuesta = new Date();
    
    // Si se proporciona un nuevo estado, actualizarlo
    if (responderContactoDto.estado) {
      contacto.estado = responderContactoDto.estado;
    } else {
      // Si no se especifica estado, marcar como CONTACTADO por defecto
      contacto.estado = ContactoEstado.CONTACTADO;
    }
    
    // Guardar el contacto actualizado
    const contactoActualizado = await this.contactoRepository.save(contacto);
    
    // Si el estado cambió a RESUELTO, enviar email automáticamente
    if (responderContactoDto.estado === ContactoEstado.RESUELTO && estadoAnterior !== ContactoEstado.RESUELTO) {
      try {
        await this.enviarEmailRespuesta(contactoActualizado);
        console.log(`✅ Email de respuesta enviado a: ${contacto.email}`);
      } catch (error) {
        console.error(`❌ Error enviando email de respuesta: ${error.message}`);
        // No fallar la operación principal si el email falla
      }
    }
    
    return contactoActualizado;
  }

  private async enviarEmailConfirmacion(contacto: Contacto): Promise<void> {
    await this.mailService.sendEmail({
      to: contacto.email,
      template: 'confirmacion-contacto',
      context: {
        nombre: contacto.nombre,
        tipo: contacto.tipo,
        asunto: contacto.asunto,
        mensaje: contacto.mensaje,
        fechaCreacion: contacto.createdAt?.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });
  }

  private async enviarEmailRespuesta(contacto: Contacto): Promise<void> {
    await this.mailService.sendEmail({
      to: contacto.email,
      template: 'respuesta-contacto',
      context: {
        nombre: contacto.nombre,
        tipo: contacto.tipo,
        asunto: contacto.asunto,
        mensaje: contacto.mensaje,
        respuesta: contacto.respuesta,
        fechaRespuesta: contacto.fechaRespuesta?.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });
  }
}
