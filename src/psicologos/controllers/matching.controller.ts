import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { MatchingService } from '../services/matching.service';
import { 
  CrearPerfilMatchingDto, 
  CrearPerfilMatchingPsicologoDto,
  CalcularMatchingDto,
  FormularioMatchingPacienteDto,
  FormularioMatchingPsicologoDto
} from '../dto/matching.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * POST /matching/calcular
   * Calcula el matching entre un paciente y todos los psicólogos disponibles
   */
  @Post('calcular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE', 'ADMIN')
  async calcularMatching(
    @Body() calcularMatchingDto: CalcularMatchingDto,
    @Request() req
  ) {
    try {
      // Verificar que el paciente esté solicitando su propio matching o sea admin
      if (req.user.role === 'PACIENTE' && req.user.id !== calcularMatchingDto.pacienteId) {
        throw new HttpException('No tienes permisos para calcular matching de otro paciente', HttpStatus.FORBIDDEN);
      }

      const resultados = await this.matchingService.calcularMatching(calcularMatchingDto.pacienteId);
      
      return {
        success: true,
        message: 'Matching calculado exitosamente',
        data: {
          pacienteId: calcularMatchingDto.pacienteId,
          totalPsicologos: resultados.length,
          resultados: resultados
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al calcular matching: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /matching/calcular-con-respuestas
   * Recibe las respuestas del formulario del paciente y retorna los 3 mejores matches
   * ENDPOINT PÚBLICO - No requiere autenticación
   */
  @Post('calcular-con-respuestas')
  async calcularMatchingConRespuestas(
    @Body() formularioDto: FormularioMatchingPacienteDto
  ) {
    try {
      console.log(`[MatchingController] Calculando matching público con respuestas recibidas`);
      console.log(`[MatchingController] Respuestas recibidas:`, formularioDto);

      // Calcular el matching directamente con las respuestas del formulario
      const todosLosResultados = await this.matchingService.calcularMatchingConRespuestas(formularioDto);
      const top3Resultados = todosLosResultados.slice(0, 3);
      
      console.log(`[MatchingController] Top 3 matches encontrados:`, top3Resultados.length);

      return {
        success: true,
        message: 'Matching calculado exitosamente con las respuestas del formulario',
        data: {
          totalPsicologosEvaluados: todosLosResultados.length,
          top3Matches: top3Resultados,
          resumen: {
            mejorMatch: top3Resultados[0] ? {
              psicologoId: top3Resultados[0].psicologoId,
              nombre: top3Resultados[0].nombrePsicologo,
              puntajeTotal: top3Resultados[0].puntajeTotal,
              porcentajeCoincidencia: top3Resultados[0].porcentajeCoincidencia
            } : null,
            puntajePromedio: top3Resultados.length > 0 
              ? Math.round((top3Resultados.reduce((sum, r) => sum + r.puntajeTotal, 0) / top3Resultados.length) * 100) / 100
              : 0
          }
        }
      };
    } catch (error) {
      console.error(`[MatchingController] Error al calcular matching con respuestas:`, error);
      throw new HttpException(
        `Error al calcular matching con respuestas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/configuracion
   * Obtiene la configuración del sistema de matching
   */
  @Get('configuracion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerConfiguracion() {
    try {
      const configuracion = this.matchingService.getConfiguracionMatching();
      
      return {
        success: true,
        message: 'Configuración del sistema de matching obtenida exitosamente',
        data: configuracion
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener configuración: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /matching/paciente/perfil
   * Crea o actualiza el perfil de matching de un paciente
   */
  @Post('paciente/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE', 'ADMIN')
  async crearPerfilMatchingPaciente(
    @Body() crearPerfilDto: CrearPerfilMatchingDto,
    @Request() req
  ) {
    try {
      // Crear o actualizar el perfil de matching del paciente
      const perfilActualizado = await this.matchingService.crearPerfilMatchingPaciente(
        req.user.id,
        crearPerfilDto
      );
      
      return {
        success: true,
        message: 'Perfil de matching del paciente creado/actualizado exitosamente',
        data: {
          pacienteId: req.user.id,
          perfil: perfilActualizado,
          perfilCompleto: true
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al crear/actualizar perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /matching/psicologo/perfil
   * Crea o actualiza el perfil de matching de un psicólogo
   */
  @Post('psicologo/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO', 'ADMIN')
  async crearPerfilMatchingPsicologo(
    @Body() crearPerfilDto: CrearPerfilMatchingPsicologoDto,
    @Request() req
  ) {
    try {
      console.log(`[MatchingController] Recibida solicitud para psicólogo: ${req.user.id}`);
      console.log(`[MatchingController] Datos recibidos:`, crearPerfilDto);

      // Crear o actualizar el perfil de matching del psicólogo
      const perfilActualizado = await this.matchingService.crearPerfilMatchingPsicologo(
        req.user.id,
        crearPerfilDto
      );
      
      console.log(`[MatchingController] Perfil actualizado exitosamente`);
      
      // Verificar si el perfil está completo para activar la cuenta
      const perfilCompleto = await this.matchingService.verificarPerfilCompleto(req.user.id);
      
      console.log(`[MatchingController] Perfil completo: ${perfilCompleto}`);
      
      return {
        success: true,
        message: 'Perfil de matching del psicólogo creado/actualizado exitosamente',
        data: {
          psicologoId: req.user.id,
          perfil: perfilActualizado,
          perfilCompleto: perfilCompleto,
          cuentaActivada: perfilCompleto
        }
      };
    } catch (error) {
      console.error(`[MatchingController] Error al crear perfil:`, error);
      throw new HttpException(
        `Error al crear/actualizar perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/paciente/:id/perfil
   * Obtiene el perfil de matching de un paciente específico
   */
  @Get('paciente/:id/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE', 'PSICOLOGO', 'ADMIN')
  async obtenerPerfilMatchingPaciente(
    @Param('id') pacienteId: string,
    @Request() req
  ) {
    try {
      // Verificar permisos
      if (req.user.role === 'PACIENTE' && req.user.id !== pacienteId) {
        throw new HttpException('No tienes permisos para ver el perfil de otro paciente', HttpStatus.FORBIDDEN);
      }

      // Obtener el perfil del paciente desde la base de datos
      const paciente = await this.matchingService.obtenerPaciente(pacienteId);

      if (!paciente) {
        throw new HttpException('Paciente no encontrado', HttpStatus.NOT_FOUND);
      }

      const perfil = {
        diagnosticos_principales: paciente.diagnosticos_principales,
        temas_principales: paciente.temas_principales,
        estilo_terapeutico_preferido: paciente.estilo_terapeutico_preferido,
        enfoque_teorico_preferido: paciente.enfoque_teorico_preferido,
        afinidad_personal_preferida: paciente.afinidad_personal_preferida,
        genero: paciente.genero,
        modalidad_preferida: paciente.modalidad_preferida,
        genero_psicologo_preferido: paciente.genero_psicologo_preferido,
        perfil_matching_completado: paciente.perfil_matching_completado,
        ultima_actualizacion_matching: paciente.ultima_actualizacion_matching
      };
      
      return {
        success: true,
        message: 'Perfil de matching del paciente obtenido exitosamente',
        data: {
          pacienteId: pacienteId,
          perfil: perfil
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/psicologo/:id/perfil
   * Obtiene el perfil de matching de un psicólogo específico
   */
  @Get('psicologo/:id/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE', 'PSICOLOGO', 'ADMIN')
  async obtenerPerfilMatchingPsicologo(
    @Param('id') psicologoId: string,
    @Request() req
  ) {
    try {
      // Verificar permisos
      if (req.user.role === 'PSICOLOGO' && req.user.id !== psicologoId) {
        throw new HttpException('No tienes permisos para ver el perfil de otro psicólogo', HttpStatus.FORBIDDEN);
      }

      // Obtener el perfil del psicólogo desde la base de datos
      const psicologo = await this.matchingService.obtenerPsicologo(psicologoId);

      if (!psicologo) {
        throw new HttpException('Psicólogo no encontrado', HttpStatus.NOT_FOUND);
      }

      const perfil = {
        diagnosticos_experiencia: psicologo.diagnosticos_experiencia,
        temas_experiencia: psicologo.temas_experiencia,
        estilo_terapeutico: psicologo.estilo_terapeutico,
        enfoque_teorico: psicologo.enfoque_teorico,
        afinidad_paciente_preferida: psicologo.afinidad_paciente_preferida,
        genero: psicologo.genero,
        modalidad_atencion: psicologo.modalidad_atencion,
        numeroRegistroProfesional: psicologo.numeroRegistroProfesional,
        experiencia: psicologo.experiencia,
        descripcion: psicologo.descripcion,
        precioPresencial: psicologo.precioPresencial,
        precioOnline: psicologo.precioOnline,
        usuario: {
          id: psicologo.usuario.id,
          nombre: psicologo.usuario.nombre,
          apellido: psicologo.usuario.apellido,
          fotoUrl: psicologo.usuario.fotoUrl,
          especialidad: psicologo.usuario.especialidad,
          estado: psicologo.usuario.estado
        }
      };
      
      return {
        success: true,
        message: 'Perfil de matching del psicólogo obtenido exitosamente',
        data: {
          psicologoId: psicologoId,
          perfil: perfil
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * PUT /matching/paciente/:id/perfil
   * Actualiza el perfil de matching de un paciente
   */
  @Put('paciente/:id/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PACIENTE', 'ADMIN')
  async actualizarPerfilMatchingPaciente(
    @Param('id') pacienteId: string,
    @Body() actualizarPerfilDto: CrearPerfilMatchingDto,
    @Request() req
  ) {
    try {
      // Verificar permisos
      if (req.user.role === 'PACIENTE' && req.user.id !== pacienteId) {
        throw new HttpException('No tienes permisos para actualizar el perfil de otro paciente', HttpStatus.FORBIDDEN);
      }

      // Aquí implementarías la lógica para actualizar el perfil del paciente
      // Por ahora retornamos un mensaje de éxito
      
      return {
        success: true,
        message: 'Perfil de matching del paciente actualizado exitosamente',
        data: {
          pacienteId: pacienteId,
          perfil: actualizarPerfilDto
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al actualizar perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * PUT /matching/psicologo/:id/perfil
   * Actualiza el perfil de matching de un psicólogo
   */
  @Put('psicologo/:id/perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO', 'ADMIN')
  async actualizarPerfilMatchingPsicologo(
    @Param('id') psicologoId: string,
    @Body() actualizarPerfilDto: CrearPerfilMatchingPsicologoDto,
    @Request() req
  ) {
    try {
      // Verificar permisos
      if (req.user.role === 'PSICOLOGO' && req.user.id !== psicologoId) {
        throw new HttpException('No tienes permisos para actualizar el perfil de otro psicólogo', HttpStatus.FORBIDDEN);
      }

      // Aquí implementarías la lógica para actualizar el perfil del psicólogo
      // Por ahora retornamos un mensaje de éxito
      
      return {
        success: true,
        message: 'Perfil de matching del psicólogo actualizado exitosamente',
        data: {
          psicologoId: psicologoId,
          perfil: actualizarPerfilDto
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al actualizar perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/mi-perfil
   * Obtiene el perfil de matching del usuario autenticado
   */
  @Get('mi-perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerMiPerfil(@Request() req) {
    try {
      if (req.user.role === 'PSICOLOGO') {
        const psicologo = await this.matchingService.obtenerPsicologo(req.user.id);

        if (!psicologo) {
          throw new HttpException('Perfil de psicólogo no encontrado', HttpStatus.NOT_FOUND);
        }

        const perfil = {
          diagnosticos_experiencia: psicologo.diagnosticos_experiencia,
          temas_experiencia: psicologo.temas_experiencia,
          estilo_terapeutico: psicologo.estilo_terapeutico,
          enfoque_teorico: psicologo.enfoque_teorico,
          afinidad_paciente_preferida: psicologo.afinidad_paciente_preferida,
          genero: psicologo.genero,
          modalidad_atencion: psicologo.modalidad_atencion,
          numeroRegistroProfesional: psicologo.numeroRegistroProfesional,
          experiencia: psicologo.experiencia,
          descripcion: psicologo.descripcion,
          precioPresencial: psicologo.precioPresencial,
          precioOnline: psicologo.precioOnline
        };

        return {
          success: true,
          message: 'Perfil de matching obtenido exitosamente',
          data: {
            role: 'PSICOLOGO',
            perfil: perfil,
            estadoUsuario: psicologo.usuario.estado
          }
        };
      } else if (req.user.role === 'PACIENTE') {
        const paciente = await this.matchingService.obtenerPaciente(req.user.id);

        if (!paciente) {
          throw new HttpException('Perfil de paciente no encontrado', HttpStatus.NOT_FOUND);
        }

        const perfil = {
          diagnosticos_principales: paciente.diagnosticos_principales,
          temas_principales: paciente.temas_principales,
          estilo_terapeutico_preferido: paciente.estilo_terapeutico_preferido,
          enfoque_teorico_preferido: paciente.enfoque_teorico_preferido,
          afinidad_personal_preferida: paciente.afinidad_personal_preferida,
          genero: paciente.genero,
          modalidad_preferida: paciente.modalidad_preferida,
          genero_psicologo_preferido: paciente.genero_psicologo_preferido
        };

        return {
          success: true,
          message: 'Perfil de matching obtenido exitosamente',
          data: {
            role: 'PACIENTE',
            perfil: perfil,
            perfilCompleto: paciente.perfil_matching_completado
          }
        };
      }

      throw new HttpException('Rol de usuario no válido', HttpStatus.BAD_REQUEST);
    } catch (error) {
      throw new HttpException(
        `Error al obtener perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/estado-perfil
   * Verifica el estado del perfil de matching del usuario autenticado
   */
  @Get('estado-perfil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async verificarEstadoPerfil(@Request() req) {
    try {
      let perfilCompleto = false;
      let mensaje = '';

      if (req.user.role === 'PSICOLOGO') {
        perfilCompleto = await this.matchingService.verificarPerfilCompleto(req.user.id);
        mensaje = perfilCompleto 
          ? 'Perfil de matching completo. Tu cuenta está activa.' 
          : 'Perfil de matching incompleto. Completa el formulario para activar tu cuenta.';
      } else if (req.user.role === 'PACIENTE') {
        perfilCompleto = await this.matchingService.verificarPerfilPacienteCompleto(req.user.id);
        mensaje = perfilCompleto 
          ? 'Perfil de matching completo.' 
          : 'Perfil de matching incompleto. Completa el formulario para obtener mejores coincidencias.';
      }

      return {
        success: true,
        message: mensaje,
        data: {
          userId: req.user.id,
          role: req.user.role,
          perfilCompleto: perfilCompleto,
          estadoUsuario: req.user.estado
        }
      };
    } catch (error) {
      throw new HttpException(
        `Error al verificar estado del perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /matching/opciones
   * Obtiene todas las opciones disponibles para el formulario de matching
   */
  @Get('opciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerOpcionesMatching() {
    try {
      // Aquí podrías retornar todas las opciones disponibles para los formularios
      const opciones = {
        diagnosticos: [
          'Ansiedad', 'Depresión', 'Pánico', 'Emociones intensas', 'Pensamientos repetitivos',
          'Fobia', 'Ansiedad social', 'Autolesión', 'Ideación suicida', 'TOC', 'TDAH',
          'Impulsividad', 'Personalidad', 'TEA', 'Dificultades adaptativas', 'Salud física',
          'Alimentación', 'Consumo de alcohol o drogas', 'Sexualidad / Género'
        ],
        temas: [
          'Autoconocimiento', 'Autoestima', 'Autonomía', 'Límites', 'Perdón', 'Identidad',
          'Regulación emocional', 'Sobreexigencia', 'Evitación', 'Relaciones', 'Patrones vinculares',
          'Conflictos familiares', 'Parentalidad', 'Trauma', 'Abuso', 'Duelo', 'Crisis existencial',
          'Cambios vitales', 'Género y sexualidad', 'Discriminación'
        ],
        estilos: [
          'Que sea auténtico/a', 'Que hable claro y con calma', 'Que me haga sentir en confianza',
          'Que tenga cercanía humana', 'Que tenga algo de humor', 'Que se preocupe por cómo estoy',
          'Que valore el vínculo', 'Que construyamos el proceso juntos/as',
          'Que sepa escuchar, pero también decir lo que necesito', 'Que me oriente cuando lo necesito',
          'Que tenga estructura y claridad en el trabajo', 'Que se adapte a mi ritmo',
          'Que me explique las cosas con base', 'Que me ayude a pensar en profundidad'
        ],
        enfoques: [
          'Cognitivo-Conductual', 'Integrativo', 'Psicoanalítico', 'Psicodinámico', 'Humanista',
          'Sistémico', 'Terapia Breve', 'Terapia Racional Emotiva', 'EMDR', 'Gestalt',
          'Terapias corporales', 'Terapia Breve Estratégica', 'Terapia Basada en la Evidencia'
        ],
        afinidades: [
          'Genuino/a', 'Cariñoso/a', 'Alegre', 'Reflexivo/a', 'Respetuoso/a', 'Confiable',
          'Sensible', 'Divertido/a', 'Dispuesto/a al cambio', 'Reservado/a', 'Expresivo/a',
          'Colaborativo/a', 'Honesto/a', 'Cauteloso/a', 'Flexible', 'Entusiasta',
          'Crítico/a constructivo/a', 'Intenso/a emocionalmente', 'Paciente', 'Introspectivo/a'
        ],
        generos: ['M', 'F', 'N'],
        modalidades: ['Online', 'Presencial', 'Ambas', 'Indiferente'],
        generosPreferidos: ['Hombre', 'Mujer', 'No binario', 'Indiferente']
      };

      return {
        success: true,
        message: 'Opciones de matching obtenidas exitosamente',
        data: opciones
      };
    } catch (error) {
      throw new HttpException(
        `Error al obtener opciones: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
