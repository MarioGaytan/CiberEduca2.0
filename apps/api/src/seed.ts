import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { Role } from './common/roles.enum';
import { UsersService } from './users/users.service';
import { User, UserDocument } from './users/schemas/user.schema';
import { Workshop, WorkshopDocument, ContentBlockType } from './workshops/schemas/workshop.schema';
import { WorkshopsService } from './workshops/workshops.service';
import { WorkshopStatus, WorkshopVisibility } from './workshops/workshop.enums';
import { Test, TestDocument } from './tests/schemas/test.schema';
import { TestsService } from './tests/tests.service';
import { TestStatus, QuestionType } from './tests/test.enums';
import { GamificationService } from './gamification/gamification.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);
    const workshopsService = app.get(WorkshopsService);
    const testsService = app.get(TestsService);
    const gamificationService = app.get(GamificationService);

    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const workshopModel = app.get<Model<WorkshopDocument>>(getModelToken(Workshop.name));
    const testModel = app.get<Model<TestDocument>>(getModelToken(Test.name));

    const defaultSchoolId = process.env.DEFAULT_SCHOOL_ID ?? 'default';
    const password = 'password';

    // ========================================
    // 1. CREAR USUARIOS DE CADA ROL
    // ========================================
    console.log('\n📦 Creando usuarios...');

    async function ensureUser(input: { username: string; role: Role }) {
      const existing = await userModel.findOne({ username: input.username }).exec();
      if (existing) {
        console.log(`  ✓ Usuario ${input.username} ya existe`);
        return existing;
      }
      const user = await usersService.createUser({
        username: input.username,
        password,
        role: input.role,
        schoolId: defaultSchoolId,
      });
      console.log(`  + Usuario ${input.username} creado (${input.role})`);
      return user;
    }

    async function ensureStudentUser(username: string) {
      const existing = await userModel.findOne({ username }).exec();
      if (existing) {
        console.log(`  ✓ Usuario ${username} ya existe`);
        return existing;
      }
      const user = await usersService.createStudentUser({
        username,
        password,
        schoolId: defaultSchoolId,
      });
      console.log(`  + Usuario ${username} creado (student)`);
      return user;
    }

    const admin = await ensureUser({ username: 'admin', role: Role.Admin });
    const reviewer = await ensureUser({ username: 'reviewer', role: Role.Reviewer });
    const teacher = await ensureUser({ username: 'maestro', role: Role.Teacher });
    const experienceManager = await ensureUser({ username: 'experience_manager', role: Role.ExperienceManager });
    const student = await ensureStudentUser('alumno');

    const adminAuth = {
      userId: String(admin._id),
      username: admin.username,
      role: Role.Admin,
      schoolId: defaultSchoolId,
    };

    const teacherAuth = {
      userId: String(teacher._id),
      username: teacher.username,
      role: Role.Teacher,
      schoolId: defaultSchoolId,
    };

    // ========================================
    // 2. CREAR TALLER DE CIBERSEGURIDAD
    // ========================================
    console.log('\n📚 Creando taller de ciberseguridad...');

    const workshopTitle = 'Fundamentos de Ciberseguridad';
    let workshop = await workshopModel
      .findOne({ schoolId: defaultSchoolId, title: workshopTitle })
      .exec();

    if (!workshop) {
      const created = await workshopsService.create(teacherAuth, {
        title: workshopTitle,
        description: 'Aprende los conceptos básicos de ciberseguridad para protegerte en el mundo digital. Este taller cubre amenazas comunes, buenas prácticas y herramientas esenciales.',
        visibility: WorkshopVisibility.Internal,
      });
      workshop = await workshopModel.findById(created._id).exec();
      console.log(`  + Taller "${workshopTitle}" creado`);
    } else {
      console.log(`  ✓ Taller "${workshopTitle}" ya existe`);
    }

    if (workshop) {
      // Agregar contenido rico al taller
      const contentBlocks = [
        {
          type: ContentBlockType.Heading,
          content: '🔐 ¿Qué es la Ciberseguridad?',
        },
        {
          type: ContentBlockType.Text,
          content: 'La ciberseguridad es el conjunto de prácticas, tecnologías y procesos diseñados para proteger sistemas, redes y datos de ataques digitales. En un mundo cada vez más conectado, entender estos conceptos es fundamental para navegar de forma segura.',
        },
        {
          type: ContentBlockType.Image,
          url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
          caption: 'La ciberseguridad protege nuestra información digital',
        },
        {
          type: ContentBlockType.Heading,
          content: '⚠️ Amenazas Comunes',
        },
        {
          type: ContentBlockType.Text,
          content: '**Phishing**: Correos o mensajes falsos que intentan robar tu información haciéndose pasar por empresas legítimas.\n\n**Malware**: Software malicioso que puede dañar tu dispositivo o robar información.\n\n**Ransomware**: Programa que secuestra tus archivos y pide rescate para liberarlos.\n\n**Ingeniería Social**: Manipulación psicológica para obtener información confidencial.',
        },
        {
          type: ContentBlockType.Image,
          url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
          caption: 'El phishing es una de las amenazas más comunes',
        },
        {
          type: ContentBlockType.Heading,
          content: '🛡️ Contraseñas Seguras',
        },
        {
          type: ContentBlockType.Text,
          content: 'Una contraseña segura debe tener:\n\n• Al menos 12 caracteres\n• Combinación de mayúsculas y minúsculas\n• Números y símbolos especiales\n• Ser única para cada cuenta\n\n**Nunca** uses información personal como fechas de nacimiento o nombres de mascotas.',
        },
        {
          type: ContentBlockType.Image,
          url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
          caption: 'Las contraseñas son tu primera línea de defensa',
        },
        {
          type: ContentBlockType.Heading,
          content: '🔒 Autenticación de Dos Factores (2FA)',
        },
        {
          type: ContentBlockType.Text,
          content: 'La autenticación de dos factores añade una capa extra de seguridad. Además de tu contraseña, necesitas un segundo elemento como:\n\n• Un código enviado a tu teléfono\n• Una app de autenticación\n• Una huella digital\n\nActiva 2FA en todas tus cuentas importantes.',
        },
        {
          type: ContentBlockType.YouTube,
          url: 'https://www.youtube.com/watch?v=hGRii5f_uSc',
          caption: 'Video explicativo sobre autenticación de dos factores',
        },
        {
          type: ContentBlockType.Heading,
          content: '🌐 Navegación Segura',
        },
        {
          type: ContentBlockType.Text,
          content: '**Consejos para navegar seguro:**\n\n1. Verifica que los sitios usen HTTPS (candado en la barra)\n2. No hagas clic en enlaces sospechosos\n3. Mantén tu navegador actualizado\n4. Usa un bloqueador de anuncios\n5. Evita redes WiFi públicas para operaciones sensibles',
        },
        {
          type: ContentBlockType.Image,
          url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
          caption: 'Navega siempre de forma consciente y segura',
        },
      ];

      await workshopModel.findByIdAndUpdate(workshop._id, {
        content: contentBlocks,
        objectives: [
          'Entender qué es la ciberseguridad y su importancia',
          'Identificar las amenazas digitales más comunes',
          'Crear y gestionar contraseñas seguras',
          'Configurar autenticación de dos factores',
          'Aplicar buenas prácticas de navegación segura',
        ],
        estimatedMinutes: 30,
        coverImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200',
      });
      console.log('  + Contenido del taller actualizado');
    }

    // Flujo de aprobación del taller
    if (workshop && workshop.status === WorkshopStatus.Draft) {
      await workshopsService.submitForReview(teacherAuth, String(workshop._id));
      workshop = await workshopModel.findById(workshop._id).exec();
      console.log('  + Taller enviado a revisión');
    }

    if (workshop && workshop.status === WorkshopStatus.InReview) {
      await workshopsService.approve(adminAuth, String(workshop._id), 'Aprobado automáticamente (seed)');
      workshop = await workshopModel.findById(workshop._id).exec();
      console.log('  + Taller aprobado');
    }

    if (!workshop) {
      throw new Error('Error al crear o recuperar el taller');
    }

    // ========================================
    // 3. CREAR TEST CON 5 PREGUNTAS CERRADAS
    // ========================================
    console.log('\n📝 Creando test de evaluación...');

    const workshopId = String(workshop._id);
    const testTitle = 'Evaluación: Fundamentos de Ciberseguridad';
    let test = await testModel
      .findOne({ schoolId: defaultSchoolId, workshopId, title: testTitle })
      .exec();

    if (!test) {
      test = await testsService.create(teacherAuth, {
        workshopId,
        title: testTitle,
        description: 'Evalúa tus conocimientos sobre los conceptos básicos de ciberseguridad.',
        questions: [
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Qué es el phishing?',
            points: 20,
            options: [
              { text: 'Un tipo de pescado digital' },
              { text: 'Un ataque que intenta robar información haciéndose pasar por una entidad legítima' },
              { text: 'Un programa para acelerar internet' },
              { text: 'Una red social nueva' },
            ],
            correctOptionIndex: 1,
          },
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Cuál es una característica de una contraseña segura?',
            points: 20,
            options: [
              { text: 'Usar tu fecha de nacimiento' },
              { text: 'Usar la misma contraseña en todos los sitios' },
              { text: 'Tener al menos 12 caracteres con números, símbolos y mayúsculas' },
              { text: 'Escribirla en un post-it pegado al monitor' },
            ],
            correctOptionIndex: 2,
          },
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Qué significa HTTPS en una URL?',
            points: 20,
            options: [
              { text: 'High Tech Transfer Protocol System' },
              { text: 'Protocolo de transferencia segura con cifrado' },
              { text: 'Homepage Text Transfer Protocol' },
              { text: 'No tiene ningún significado especial' },
            ],
            correctOptionIndex: 1,
          },
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Qué es la autenticación de dos factores (2FA)?',
            points: 20,
            options: [
              { text: 'Usar dos contraseñas diferentes' },
              { text: 'Iniciar sesión desde dos dispositivos' },
              { text: 'Una capa adicional de seguridad que requiere un segundo método de verificación' },
              { text: 'Tener dos cuentas en el mismo servicio' },
            ],
            correctOptionIndex: 2,
          },
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Qué es el ransomware?',
            points: 20,
            options: [
              { text: 'Un antivirus gratuito' },
              { text: 'Software que secuestra archivos y pide rescate para liberarlos' },
              { text: 'Una red privada virtual' },
              { text: 'Un tipo de firewall' },
            ],
            correctOptionIndex: 1,
          },
        ],
      });
      console.log(`  + Test "${testTitle}" creado`);
    } else {
      console.log(`  ✓ Test "${testTitle}" ya existe`);
    }

    // Flujo de aprobación del test
    if (test.status === TestStatus.Draft) {
      await testsService.submitForReview(teacherAuth, String(test._id));
      test = (await testModel.findById(test._id).exec())!;
      console.log('  + Test enviado a revisión');
    }

    if (test.status === TestStatus.InReview) {
      await testsService.approve(adminAuth, String(test._id), 'Aprobado automáticamente (seed)');
      test = (await testModel.findById(test._id).exec())!;
      console.log('  + Test aprobado');
    }

    // ========================================
    // 4. CONFIGURAR GAME MANAGER
    // ========================================
    console.log('\n🎮 Configurando sistema de gamificación...');

    // Obtener o crear configuración de gamificación
    let gamificationConfig = await gamificationService.getConfig(defaultSchoolId);
    
    if (!gamificationConfig) {
      // Forzar creación de config con valores por defecto
      gamificationConfig = await gamificationService.getConfig(defaultSchoolId);
    }

    // Actualizar reglas de XP
    await gamificationService.updateXpRules(defaultSchoolId, {
      testBaseXp: 10,
      testPointMultiplier: 1,
      testPerfectBonus: 25,
      workshopCompletionXp: 75,
      dailyStreakXp: 10,
      weeklyStreakBonus: 75,
      monthlyStreakBonus: 250,
    }, adminAuth.userId);
    console.log('  + Reglas de XP configuradas');

    // Actualizar configuración de niveles
    await gamificationService.updateLevelConfig(defaultSchoolId, {
      baseXpPerLevel: 100,
      levelMultiplier: 1.15,
      maxLevel: 100,
    }, adminAuth.userId);
    console.log('  + Configuración de niveles actualizada');

    console.log('  + Medallas configuradas (usando defaults)');
    console.log('  + Opciones de avatar configuradas (usando defaults)');

    // ========================================
    // RESUMEN FINAL
    // ========================================
    const summary = {
      ok: true,
      schoolId: defaultSchoolId,
      usuarios: {
        admin: { username: 'admin', password, rol: 'admin' },
        reviewer: { username: 'reviewer', password, rol: 'reviewer' },
        maestro: { username: 'maestro', password, rol: 'teacher' },
        experience_manager: { username: 'experience_manager', password, rol: 'experience_manager' },
        alumno: { username: 'alumno', password, rol: 'student' },
      },
      taller: {
        id: String(workshop._id),
        titulo: workshop.title,
        estado: workshop.status,
        objetivos: 5,
        bloques_contenido: workshop.content?.length || 0,
      },
      test: {
        id: String(test._id),
        titulo: test.title,
        estado: test.status,
        preguntas: 5,
        puntos_totales: 100,
      },
      gamificacion: {
        xp_base_test: 10,
        bonus_perfecto: 25,
        xp_taller: 75,
        nivel_maximo: 100,
      },
    };

    console.log('\n✅ SEED COMPLETADO EXITOSAMENTE\n');
    console.log('═══════════════════════════════════════════');
    console.log('CREDENCIALES DE ACCESO:');
    console.log('═══════════════════════════════════════════');
    console.log('  admin           / password  (Administrador)');
    console.log('  reviewer        / password  (Revisor)');
    console.log('  maestro         / password  (Profesor)');
    console.log('  experience_manager / password (Gestor de Experiencia)');
    console.log('  alumno          / password  (Estudiante)');
    console.log('═══════════════════════════════════════════\n');

    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exitCode = 1;
});
