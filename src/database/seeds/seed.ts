import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Plan, TipoPlan } from '../../common/entities/plan.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🚀 Iniciando seed de datos básicos...');

    // ========================================
    // 👤 USUARIO ADMINISTRADOR
    // ========================================
    console.log('👤 Creando usuario administrador...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userRepo = dataSource.getRepository(User);
    
    // Verificar si ya existe el admin
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@psicoespacios.com' } });
    if (!existingAdmin) {
      const admin = new User();
      admin.email = 'admin@psicoespacios.com';
      admin.password = adminPassword;
      admin.nombre = 'Admin';
      admin.apellido = 'Sistema';
      admin.role = 'ADMIN';
      admin.estado = 'ACTIVO';
      await userRepo.save(admin);
      console.log('✅ Usuario administrador creado');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    // ========================================
    // 📋 PLANES DE SUSCRIPCIÓN
    // ========================================
    console.log('📋 Creando planes de suscripción...');
    const planRepo = dataSource.getRepository(Plan);
    
    const planes = [
      {
        tipo: TipoPlan.BASICO,
        nombre: 'Plan Básico',
        descripcion: 'Plan ideal para psicólogos que están comenzando',
        precio: 29990,
        duracion: 1,
        horasIncluidas: 20,
        beneficios: [
          'Hasta 20 horas de reserva de box por mes',
          'Sistema de derivación básico',
          'Reportes mensuales básicos',
          'Soporte por email'
        ],
        activo: true,
      }
    ];

    for (const planData of planes) {
      // Verificar si ya existe el plan
      const existingPlan = await planRepo.findOne({ 
        where: { 
          tipo: planData.tipo,
          nombre: planData.nombre 
        } 
      });
      
      if (!existingPlan) {
        const plan = new Plan();
        Object.assign(plan, planData);
        await planRepo.save(plan);
        console.log(`✅ Plan creado: ${planData.nombre}`);
      } else {
        console.log(`ℹ️  Plan ya existe: ${planData.nombre}`);
      }
    }

    console.log('🎉 ¡Seed de datos básicos completado exitosamente!');
    console.log('');
    console.log('📊 Resumen de datos creados:');
    console.log('👤 Usuario Admin: admin@psicoespacios.com (contraseña: admin123)');
    console.log('📋 Planes: Básico ($29.990), Profesional ($49.990) y Premium ($79.990)');
    console.log('');
    console.log('💡 Datos mínimos necesarios para el funcionamiento del sistema.');

  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();