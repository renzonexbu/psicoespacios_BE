import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pago } from '../../common/entities/pago.entity';
import { Voucher } from '../../common/entities/voucher.entity';
import { CreatePagoDto } from '../dto/create-pago.dto';
import { PagoResponseDto } from '../dto/pago-response.dto';

@Injectable()
export class PagoCuponService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    private dataSource: DataSource,
  ) {}

  async procesarPagoConCupon(createPagoDto: CreatePagoDto): Promise<PagoResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let cupon: Voucher | undefined = undefined;
      let descuentoAplicado = 0;

      // Si se proporciona un cupón, validarlo y aplicarlo
      if (createPagoDto.cuponId) {
        cupon = await this.validarYUsarCupon(createPagoDto.cuponId, queryRunner);
        descuentoAplicado = this.calcularDescuento(createPagoDto.monto, cupon.porcentaje);
      }

      // Verificar que el monto final sea correcto
      const montoFinalCalculado = createPagoDto.monto - descuentoAplicado;
      if (Math.abs(montoFinalCalculado - createPagoDto.montoFinal) > 0.01) {
        throw new BadRequestException('El monto final no coincide con el descuento aplicado');
      }

      // Crear el pago
      const pago = this.pagoRepository.create({
        ...createPagoDto,
        cuponId: cupon?.id,
        descuentoAplicado,
        montoFinal: montoFinalCalculado,
      });

      const pagoGuardado = await queryRunner.manager.save(Pago, pago);

      // Si se usó un cupón, incrementar el contador de usos
      if (cupon) {
        cupon.usosActuales += 1;
        await queryRunner.manager.save(Voucher, cupon);
      }

      await queryRunner.commitTransaction();

      // Retornar el pago con información del cupón
      return this.mapToResponseDto(pagoGuardado, cupon);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validarYUsarCupon(cuponId: string, queryRunner: any): Promise<Voucher> {
    const cupon = await queryRunner.manager.findOne(Voucher, {
      where: { id: cuponId },
      relations: ['psicologo', 'psicologo.usuario']
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    // Verificar que no haya expirado
    if (cupon.vencimiento < new Date()) {
      throw new BadRequestException('Cupón expirado');
    }

    // Verificar que no se haya agotado
    if (cupon.usosActuales >= cupon.limiteUsos) {
      throw new BadRequestException('Cupón agotado');
    }

    return cupon;
  }

  private calcularDescuento(monto: number, porcentaje: number): number {
    return (monto * porcentaje) / 100;
  }

  private mapToResponseDto(pago: Pago, cupon?: Voucher): PagoResponseDto {
    return {
      id: pago.id,
      tipo: pago.tipo,
      monto: pago.monto,
      descuentoAplicado: pago.descuentoAplicado,
      montoFinal: pago.montoFinal,
      estado: pago.estado,
      cuponId: pago.cuponId,
      cupon: cupon ? {
        id: cupon.id,
        nombre: cupon.nombre,
        porcentaje: cupon.porcentaje,
        modalidad: cupon.modalidad,
      } : undefined,
      datosTransaccion: pago.datosTransaccion,
      notasReembolso: pago.notasReembolso,
      metadatos: pago.metadatos,
      fechaCompletado: pago.fechaCompletado,
      fechaReembolso: pago.fechaReembolso,
      createdAt: pago.createdAt,
      updatedAt: pago.updatedAt,
    };
  }

  async obtenerPagosConCupon(cuponId: string): Promise<PagoResponseDto[]> {
    const pagos = await this.pagoRepository.find({
      where: { cuponId },
      relations: ['cupon'],
      order: { createdAt: 'DESC' }
    });

    return pagos.map(pago => this.mapToResponseDto(pago, pago.cupon));
  }
}
