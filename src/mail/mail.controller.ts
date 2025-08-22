import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { MailService } from './mail.service';

@Controller('api/v1/mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // ========================================
  // ENDPOINTS PÚBLICOS PARA TESTING
  // ========================================
  // ⚠️  IMPORTANTE: Estos endpoints son solo para testing
  //     Remover antes de producción
  
  @Post('test/bienvenida-public')
  async testBienvenidaPublic(@Body() data: {
    email: string;
    nombre: string;
  }) {
    console.log('📧 Enviando email de bienvenida público a:', data.email);
    
    const result = await this.mailService.sendBienvenida(
      data.email,
      data.nombre
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test/reserva-confirmada-public')
  async testReservaConfirmadaPublic(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
    modalidad: string;
    ubicacion?: string;
  }) {
    console.log('📧 Enviando email de reserva confirmada público a:', data.email);
    
    const result = await this.mailService.sendReservaConfirmada(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora,
      data.modalidad,
      data.ubicacion
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test/pago-exitoso-public')
  async testPagoExitosoPublic(@Body() data: {
    email: string;
    monto: number;
    fecha: string;
    psicologoNombre: string;
  }) {
    console.log('📧 Enviando email de pago exitoso público a:', data.email);
    
    const result = await this.mailService.sendPagoExitoso(
      data.email,
      data.monto,
      data.fecha,
      data.psicologoNombre
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test/sesion-cancelada-public')
  async testSesionCanceladaPublic(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
  }) {
    console.log('📧 Enviando email de sesión cancelada público a:', data.email);
    
    const result = await this.mailService.sendSesionCancelada(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test/recordatorio-public')
  async testRecordatorioPublic(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
    modalidad: string;
    ubicacion?: string;
  }) {
    console.log('📧 Enviando email de recordatorio público a:', data.email);
    
    const result = await this.mailService.sendRecordatorioSesion(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora,
      data.modalidad,
      data.ubicacion
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test/reserva-confirmada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testReservaConfirmada(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
    modalidad: string;
    ubicacion?: string;
  }) {
    const result = await this.mailService.sendReservaConfirmada(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora,
      data.modalidad,
      data.ubicacion
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/pago-exitoso')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testPagoExitoso(@Body() data: {
    email: string;
    monto: number;
    fecha: string;
    psicologoNombre: string;
  }) {
    const result = await this.mailService.sendPagoExitoso(
      data.email,
      data.monto,
      data.fecha,
      data.psicologoNombre
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/cupon-aplicado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testCuponAplicado(@Body() data: {
    email: string;
    codigoCupon: string;
    descuento: number;
    psicologoNombre: string;
  }) {
    const result = await this.mailService.sendCuponAplicado(
      data.email,
      data.codigoCupon,
      data.descuento,
      data.psicologoNombre
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/bienvenida')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testBienvenida(@Body() data: {
    email: string;
    nombre: string;
  }) {
    const result = await this.mailService.sendBienvenida(
      data.email,
      data.nombre
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/nueva-nota')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testNuevaNota(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
  }) {
    const result = await this.mailService.sendNuevaNota(
      data.email,
      data.psicologoNombre,
      data.fecha
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/sesion-cancelada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testSesionCancelada(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
  }) {
    const result = await this.mailService.sendSesionCancelada(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Post('test/recordatorio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testRecordatorio(@Body() data: {
    email: string;
    psicologoNombre: string;
    fecha: string;
    hora: string;
    modalidad: string;
    ubicacion?: string;
  }) {
    const result = await this.mailService.sendRecordatorioSesion(
      data.email,
      data.psicologoNombre,
      data.fecha,
      data.hora,
      data.modalidad,
      data.ubicacion
    );
    
    return {
      success: result,
      message: result ? 'Email enviado exitosamente' : 'Error al enviar email',
      data: data
    };
  }

  @Get('health')
  async health() {
    return {
      status: 'ok',
      service: 'Mail Service',
      timestamp: new Date().toISOString()
    };
  }
}

