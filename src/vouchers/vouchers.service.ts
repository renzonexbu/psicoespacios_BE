import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Voucher } from '../common/entities/voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto } from '../common/dto/voucher.dto';
import { ValidarCuponResponseDto } from './dto/validar-cupon.dto';
import { Psicologo } from '../common/entities/psicologo.entity';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Buscar el psicólogo por su userId
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: createVoucherDto.psicologoUserId } },
      relations: ['usuario']
    });
    
    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado para este usuario');
    }

    // Crear el voucher usando el ID del psicólogo (no del usuario)
    const voucher = this.voucherRepository.create({
      nombre: createVoucherDto.nombre,
      porcentaje: createVoucherDto.porcentaje,
      vencimiento: createVoucherDto.vencimiento,
      modalidad: createVoucherDto.modalidad,
      psicologoId: psicologo.id, // Usar el ID del psicólogo, no del usuario
      limiteUsos: createVoucherDto.limiteUsos,
      psicologo
    });
    
    return this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepository.find({ 
      where: { deletedAt: IsNull() }, // Solo vouchers no eliminados
      relations: ['psicologo'] 
    });
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ where: { id }, relations: ['psicologo'] });
    if (!voucher) throw new NotFoundException('Voucher no encontrado');
    return voucher;
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    const voucher = await this.findOne(id);
    Object.assign(voucher, updateVoucherDto);
    return this.voucherRepository.save(voucher);
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);
    // Soft delete: marcar como eliminado en lugar de eliminar físicamente
    voucher.deletedAt = new Date();
    await this.voucherRepository.save(voucher);
  }

  async restore(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    if (!voucher) {
      throw new NotFoundException('Voucher no encontrado o ya está activo');
    }
    
    // Restaurar el voucher
    voucher.deletedAt = null;
    return this.voucherRepository.save(voucher);
  }

  async findByPsicologoUserId(psicologoUserId: string): Promise<Voucher[]> {
    // Buscar el psicólogo por su userId
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: psicologoUserId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado para este usuario');
    }

    // Buscar todos los vouchers del psicólogo (solo los no eliminados)
    return this.voucherRepository.find({
      where: { 
        psicologoId: psicologo.id,
        deletedAt: IsNull() // Solo vouchers no eliminados
      },
      relations: ['psicologo', 'psicologo.usuario'],
      order: { createdAt: 'DESC' }
    });
  }

  async validarCupon(codigo: string): Promise<ValidarCuponResponseDto> {
    try {
      // Buscar el voucher por nombre (código)
      const voucher = await this.voucherRepository.findOne({
        where: { 
          nombre: codigo,
          deletedAt: IsNull() // Solo vouchers no eliminados
        },
        relations: ['psicologo', 'psicologo.usuario']
      });

      if (!voucher) {
        return {
          valido: false,
          mensaje: 'Cupón no encontrado',
          error: 'CUPON_NO_EXISTE'
        };
      }

      // Verificar que no haya expirado
      const ahora = new Date();
      if (voucher.vencimiento < ahora) {
        return {
          valido: false,
          mensaje: 'Cupón expirado',
          error: 'CUPON_EXPIRADO'
        };
      }

      // Verificar que no se haya agotado
      if (voucher.usosActuales >= voucher.limiteUsos) {
        return {
          valido: false,
          mensaje: 'Cupón agotado',
          error: 'CUPON_AGOTADO'
        };
      }

      // Cupón válido
      return {
        valido: true,
        mensaje: 'Cupón válido',
        id: voucher.id, // ID del cupón para usar en el pago
        descuento: voucher.porcentaje,
        modalidad: voucher.modalidad,
        psicologoNombre: `${voucher.psicologo.usuario.nombre} ${voucher.psicologo.usuario.apellido}`
      };

    } catch (error) {
      console.error('Error al validar cupón:', error);
      return {
        valido: false,
        mensaje: 'Error al validar cupón',
        error: 'ERROR_VALIDACION'
      };
    }
  }
} 