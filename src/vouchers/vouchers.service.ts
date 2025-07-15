import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../common/entities/voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto } from '../common/dto/voucher.dto';
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
    const psicologo = await this.psicologoRepository.findOne({ where: { id: createVoucherDto.psicologoId } });
    if (!psicologo) throw new NotFoundException('Psicólogo no encontrado');
    const voucher = this.voucherRepository.create({ ...createVoucherDto, psicologo });
    return this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepository.find({ relations: ['psicologo'] });
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
    await this.voucherRepository.remove(voucher);
  }
} 