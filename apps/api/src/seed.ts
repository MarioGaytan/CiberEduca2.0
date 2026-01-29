import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { Role } from './common/roles.enum';
import { UsersService } from './users/users.service';
import { User, UserDocument } from './users/schemas/user.schema';
import { Workshop, WorkshopDocument } from './workshops/schemas/workshop.schema';
import { WorkshopsService } from './workshops/workshops.service';
import { WorkshopStatus, WorkshopVisibility } from './workshops/workshop.enums';
import { Test, TestDocument } from './tests/schemas/test.schema';
import { TestsService } from './tests/tests.service';
import { TestStatus, QuestionType } from './tests/test.enums';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const usersService = app.get(UsersService);
    const workshopsService = app.get(WorkshopsService);
    const testsService = app.get(TestsService);

    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const workshopModel = app.get<Model<WorkshopDocument>>(getModelToken(Workshop.name));
    const testModel = app.get<Model<TestDocument>>(getModelToken(Test.name));

    const defaultSchoolId = process.env.DEFAULT_SCHOOL_ID ?? 'default';

    const adminUsername = 'admin_test';
    const teacherUsername = 'teacher_test';
    const studentUsername = 'student_test';
    const password = 'password';

    async function ensureUser(input: {
      username: string;
      role: Role;
    }) {
      const existing = await userModel.findOne({ username: input.username }).exec();
      if (existing) return existing;

      return usersService.createUser({
        username: input.username,
        password,
        role: input.role,
        schoolId: defaultSchoolId,
      });
    }

    const admin = await ensureUser({ username: adminUsername, role: Role.Admin });
    const teacher = await ensureUser({ username: teacherUsername, role: Role.Teacher });

    const existingStudent = await userModel.findOne({ username: studentUsername }).exec();
    const student =
      existingStudent ??
      (await usersService.createStudentUser({
        username: studentUsername,
        password,
        schoolId: defaultSchoolId,
      }));

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

    const workshopTitle = 'Taller Base: Introducción a Ciberseguridad';
    let workshop = await workshopModel
      .findOne({
        schoolId: defaultSchoolId,
        title: workshopTitle,
        createdByUserId: teacherAuth.userId,
      })
      .exec();

    if (!workshop) {
      workshop = await workshopsService.create(teacherAuth, {
        title: workshopTitle,
        description: 'Taller de ejemplo para probar la UI de CiberEduca.',
        visibility: WorkshopVisibility.Internal,
      });
    }

    if (workshop.status === WorkshopStatus.Draft) {
      await workshopsService.submitForReview(teacherAuth, String(workshop._id));
      workshop = (await workshopModel.findById(workshop._id).exec())!;
    }

    if (workshop.status === WorkshopStatus.InReview) {
      await workshopsService.approve(adminAuth, String(workshop._id), 'Aprobado (seed)');
      workshop = (await workshopModel.findById(workshop._id).exec())!;
    }

    const testTitle = 'Test Base: Seguridad Básica';
    let test = await testModel
      .findOne({
        schoolId: defaultSchoolId,
        workshopId: String(workshop._id),
        title: testTitle,
        createdByUserId: teacherAuth.userId,
      })
      .exec();

    if (!test) {
      test = await testsService.create(teacherAuth, {
        workshopId: String(workshop._id),
        title: testTitle,
        description: 'Test de ejemplo con opción múltiple y pregunta abierta.',
        questions: [
          {
            type: QuestionType.MultipleChoice,
            prompt: '¿Cuál es una buena práctica para contraseñas?'
              .trim(),
            points: 10,
            options: [
              { text: 'Usar la misma contraseña en todos lados' },
              { text: 'Usar una contraseña larga y única' },
              { text: 'Compartirla con tus amigos' },
            ],
            correctOptionIndex: 1,
          },
          {
            type: QuestionType.Open,
            prompt: 'Explica con tus palabras qué es el phishing.',
            points: 10,
          },
        ],
      });
    }

    if (test.status === TestStatus.Draft) {
      await testsService.submitForReview(teacherAuth, String(test._id));
      test = (await testModel.findById(test._id).exec())!;
    }

    if (test.status === TestStatus.InReview) {
      await testsService.approve(adminAuth, String(test._id), 'Aprobado (seed)');
      test = (await testModel.findById(test._id).exec())!;
    }

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          schoolId: defaultSchoolId,
          users: {
            admin: { username: adminUsername, password },
            teacher: { username: teacherUsername, password },
            student: { username: studentUsername, password },
          },
          workshop: { id: String(workshop._id), title: workshop.title, status: workshop.status },
          test: { id: String(test._id), title: test.title, status: test.status },
        },
        null,
        2,
      ) + '\n',
    );
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
