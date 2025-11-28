import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailData {
  to: string;
  template: string;
  context: Record<string, any>;
  fromAccount?: 'default' | 'alt';
  fromEmailOverride?: string;
  fromNameOverride?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private transporterAlt?: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  private fromEmailAlt?: string;
  private fromNameAlt?: string;
  private readonly headerImage = 'https://s3.us-east-005.backblazeb2.com/psicoespacios/images/54bc1a52-a895-4cd9-9358-f684717c389b.png';
  private readonly footerImage = 'https://s3.us-east-005.backblazeb2.com/psicoespacios/images/3df56d51-de7d-496d-9eab-4c8f89d44793.png';
  private readonly telefonoPsicologos = '+56950553501';
  private readonly telefonoPacientes = '+56939488058';

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
    // Asegurar strings no undefined para evitar errores de tipo
    this.fromEmail = this.configService.get<string>('MAIL_FROM') ?? this.configService.get<string>('MAIL_USER') ?? '';
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'PsicoEspacios';

    // Transport alternativo (opcional)
    const altHost = this.configService.get<string>('MAIL_ALT_HOST');
    const altUser = this.configService.get<string>('MAIL_ALT_USER');
    const altPass = this.configService.get<string>('MAIL_ALT_PASS');
    if (altHost && altUser && altPass) {
      this.transporterAlt = nodemailer.createTransport({
        host: altHost,
        port: this.configService.get<number>('MAIL_ALT_PORT') || 587,
        secure: this.configService.get<boolean>('MAIL_ALT_SECURE') || false,
        auth: {
          user: altUser,
          pass: altPass,
        },
      });
      this.fromEmailAlt = this.configService.get<string>('MAIL_ALT_FROM') || altUser;
      this.fromNameAlt = this.configService.get<string>('MAIL_ALT_FROM_NAME') || this.fromName;
    }

    // Verificar conexión
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Error al conectar con el servidor de email:', error);
      } else {
        this.logger.log('Servidor de email conectado exitosamente');
      }
    });

    if (this.transporterAlt) {
      this.transporterAlt.verify((error, success) => {
        if (error) {
          this.logger.error('Error al conectar con el servidor de email ALT:', error);
        } else {
          this.logger.log('Servidor de email ALT conectado exitosamente');
        }
      });
    }
  }

  private getEmailTemplate(templateName: string, context: Record<string, any>): EmailTemplate {
    // Usar la variable de entorno o fallback a la ruta relativa
    const templatesPath = this.configService.get<string>('MAIL_TEMPLATES_PATH') || 
                         path.join(process.cwd(), 'src', 'mail', 'templates');
    
    const templatePath = path.join(templatesPath, `${templateName}.hbs`);
    
    this.logger.log(`Buscando template en: ${templatePath}`);
    
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Resolver audiencia y teléfono de contacto
      const audiencia = this.resolveAudiencia(templateName, context);
      const telefonoContacto = audiencia === 'psicologo' ? this.telefonoPsicologos : this.telefonoPacientes;

      // Agregar header, footer y datos comunes a todos los templates
      const fullContext = {
        ...context,
        headerImage: this.headerImage,
        footerImage: this.footerImage,
        currentYear: new Date().getFullYear(),
        FRONT_URL: this.configService.get<string>('FRONT_URL', 'http://localhost:3001'),
        telefonoContacto,
        audiencia,
      };
      
      const html = compiledTemplate(fullContext);
      
      return {
        subject: this.getSubjectForTemplate(templateName, context),
        html: this.wrapWithLayout(html, telefonoContacto),
      };
    } catch (error) {
      this.logger.error(`Error al cargar template ${templateName}:`, error);
      throw new Error(`Template ${templateName} no encontrado`);
    }
  }

  private getSubjectForTemplate(templateName: string, context: Record<string, any>): string {
    const subjects: Record<string, string> = {
      'reserva-confirmada': `Reserva Confirmada - ${context.psicologoNombre || 'PsicoEspacios'}`,
      'reserva-recordatorio': `Recordatorio de Sesión - ${context.fecha || 'PsicoEspacios'}`,
      'pago-exitoso': 'Pago Confirmado - PsicoEspacios',
      'nueva-nota': 'Nueva Nota Clínica - PsicoEspacios',
      'sesion-cancelada': 'Sesión Cancelada - PsicoEspacios',
      'bienvenida': 'Bienvenido a PsicoEspacios',
      'bienvenida-paciente': 'Bienvenido a PsicoEspacios - Tu cuenta ha sido creada',
      'cupon-aplicado': 'Cupón Aplicado - PsicoEspacios',
      'respuesta-contacto': 'Respuesta a tu consulta de formulario web',
      'confirmacion-contacto': 'Confirmación de consulta recibida - PsicoEspacios',
      'subrol-actualizado': 'Tu cuenta profesional ha sido activada - PsicoEspacios',
      'reserva-box-confirmada': 'Reserva de Box Confirmada - PsicoEspacios',
      'reserva-box-cancelada': 'Cancelación de Reserva de Box - PsicoEspacios',
      'reserva-box-cancelada-admin': 'Tu reserva fue cancelada - PsicoEspacios',
      'sesion-confirmada-derivacion': 'Confirmación de sesión del centro de derivación',
      'sesion-confirmada-psicologo': 'Nueva sesión confirmada - PsicoEspacios',
      'sesion-cancelada-derivacion': 'Tu sesión ha sido cancelada - PsicoEspacios',
      'sesion-cancelada-psicologo': 'Sesión cancelada - PsicoEspacios',
      'suscripcion-secretaria-activa': 'Tu suscripción a Secretaría Virtual está activa',
      'sesion-creada-derivacion': 'Nueva sesión agendada - PsicoEspacios',
    };
    
    return subjects[templateName] || 'PsicoEspacios';
  }

  private wrapWithLayout(content: string, telefonoContacto?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PsicoEspacios</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px; 
            background-color: #ffffff;
            border-bottom: 2px solid #e0e0e0;
          }
          .header img { 
            max-width: 100%; 
            height: auto; 
          }
          .content { 
            padding: 30px; 
            background-color: #ffffff;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            background-color: #f8f9fa;
            border-top: 2px solid #e0e0e0;
          }
          .footer img { 
            max-width: 100%; 
            height: auto; 
          }
          .footer-text {
            margin-top: 15px;
            color: #666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #E91711;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #C4120E;
          }
          .info-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
          }
          .success-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            color: #155724;
          }
          .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${this.headerImage}" alt="PsicoEspacios Header" />
          </div>
          
          <div class="content">
            ${content}
          </div>
          
          <div class="footer">
            <img src="${this.footerImage}" alt="PsicoEspacios Footer" />
            <div class="footer-text">
              © ${new Date().getFullYear()} PsicoEspacios. Todos los derechos reservados.<br>
              Este es un email automático, por favor no respondas a este mensaje.
              ${telefonoContacto ? `<br>Contacto: ${telefonoContacto}` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Determina la audiencia del email (paciente o psicologo) en base al template o un override en el contexto.
   */
  private resolveAudiencia(templateName: string, context: Record<string, any>): 'paciente' | 'psicologo' {
    // Permitir override explícito desde el contexto
    if (context && typeof context.audiencia === 'string') {
      const val = String(context.audiencia).toLowerCase();
      if (val === 'psicologo') return 'psicologo';
      return 'paciente';
    }

    // Mapear por nombre de template (por defecto, son emails dirigidos a pacientes)
    const templatesParaPsicologos = new Set<string>([
      // agregar aquí templates que vayan a psicólogos cuando existan
    ]);

    return templatesParaPsicologos.has(templateName) ? 'psicologo' : 'paciente';
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(emailData.template, emailData.context);

      // Seleccionar cuenta de envío
      const useAlt = emailData.fromAccount === 'alt' && this.transporterAlt;
      const transporter = useAlt ? this.transporterAlt! : this.transporter;
      const fromEmail = emailData.fromEmailOverride
        || (useAlt ? (this.fromEmailAlt || this.fromEmail) : this.fromEmail);
      const fromName = emailData.fromNameOverride
        || (useAlt ? (this.fromNameAlt || this.fromName) : this.fromName);

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: emailData.to,
        subject: template.subject,
        html: template.html,
      };

      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado exitosamente a ${emailData.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error al enviar email a ${emailData.to}:`, error);
      return false;
    }
  }

  // Métodos específicos para diferentes tipos de emails
  async sendReservaConfirmada(
    pacienteEmail: string, 
    psicologoNombre: string, 
    fecha: string, 
    hora: string, 
    modalidad: string,
    ubicacion?: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'reserva-confirmada',
      context: {
        psicologoNombre,
        fecha,
        hora,
        modalidad,
        ubicacion: ubicacion || 'Online',
      },
      fromAccount,
    });
  }

  async sendRecordatorioSesion(
    pacienteEmail: string,
    psicologoNombre: string,
    fecha: string,
    hora: string,
    modalidad: string,
    ubicacion?: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'reserva-recordatorio',
      context: {
        psicologoNombre,
        fecha,
        hora,
        modalidad,
        ubicacion: ubicacion || 'Online',
      },
      fromAccount,
    });
  }

  async sendPagoExitoso(
    pacienteEmail: string,
    monto: number,
    fecha: string,
    psicologoNombre: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'pago-exitoso',
      context: {
        monto: monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }),
        fecha,
        psicologoNombre,
      },
      fromAccount,
    });
  }

  async sendNuevaNota(
    pacienteEmail: string,
    psicologoNombre: string,
    fecha: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'nueva-nota',
      context: {
        psicologoNombre,
        fecha,
      },
      fromAccount,
    });
  }

  async sendSesionCancelada(
    pacienteEmail: string,
    psicologoNombre: string,
    fecha: string,
    hora: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'sesion-cancelada',
      context: {
        psicologoNombre,
        fecha,
        hora,
      },
      fromAccount,
    });
  }

  async sendBienvenida(
    pacienteEmail: string,
    nombre: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'bienvenida',
      context: {
        nombre,
      },
      fromAccount,
    });
  }

  async sendCuponAplicado(
    pacienteEmail: string,
    codigoCupon: string,
    descuento: number,
    psicologoNombre: string,
    fromAccount?: 'default' | 'alt'
  ): Promise<boolean> {
    return this.sendEmail({
      to: pacienteEmail,
      template: 'cupon-aplicado',
      context: {
        codigoCupon,
        descuento: descuento.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' }),
        psicologoNombre,
      },
      fromAccount,
    });
  }

  async sendReservaBoxConfirmada(
    email: string,
    fecha: string,
    hora: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'reserva-box-confirmada',
      context: {
        fecha,
        hora,
      }
    });
  }

  async sendReservaBoxCancelada(
    email: string,
    fecha: string,
    hora: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'reserva-box-cancelada',
      context: {
        fecha,
        hora,
      }
    });
  }

  async sendSesionConfirmadaDerivacion(
    email: string,
    psicologoNombre: string,
    fecha: string,
    hora: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'sesion-confirmada-derivacion',
      context: {
        psicologoNombre,
        fecha,
        hora,
      },
      fromAccount: 'alt'
    });
  }

  async sendSesionConfirmadaPsicologo(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'sesion-confirmada-psicologo',
      context: {},
    });
  }

  async sendSesionCanceladaDerivacion(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'sesion-cancelada-derivacion',
      context: {},
      fromAccount: 'alt'
    });
  }

  async sendSesionCanceladaPsicologo(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'sesion-cancelada-psicologo',
      context: {},
    });
  }

  async sendSuscripcionSecretariaActiva(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'suscripcion-secretaria-activa',
      context: {},
    });
  }

  async sendSesionCreadaDerivacion(email: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      template: 'sesion-creada-derivacion',
      context: {},
      fromAccount: 'alt'
    });
  }
}
