import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/roles.enum';
import { Workshop, WorkshopDocument } from '../workshops/schemas/workshop.schema';
import { WorkshopStatus, WorkshopVisibility } from '../workshops/workshop.enums';
import { AuthUser } from '../workshops/workshops.service';
import { QuestionType, TestStatus } from './test.enums';
import { Test, TestDocument } from './schemas/test.schema';
import { TestAttempt, TestAttemptDocument } from './schemas/test-attempt.schema';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test.name) private readonly testModel: Model<TestDocument>,
    @InjectModel(TestAttempt.name)
    private readonly attemptModel: Model<TestAttemptDocument>,
    @InjectModel(Workshop.name)
    private readonly workshopModel: Model<WorkshopDocument>,
  ) {}

  private requireSchoolId(user: AuthUser): string {
    if (!user.schoolId) {
      throw new BadRequestException('Usuario sin escuela asignada.');
    }
    return user.schoolId;
  }

  private async assertTeacherWorkshopAccess(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (user.role !== Role.Admin && workshop.createdByUserId !== user.userId) {
      throw new ForbiddenException('Solo el creador del taller o admin puede administrar.');
    }

    return workshop;
  }

  private async assertStudentWorkshopAccess(user: AuthUser, workshopId: string) {
    const workshop = await this.workshopModel.findById(workshopId).exec();
    if (!workshop) throw new NotFoundException('Taller no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (workshop.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este taller.');
    }

    if (workshop.status !== WorkshopStatus.Approved) {
      throw new ForbiddenException('Taller no disponible.');
    }

    if (workshop.visibility !== WorkshopVisibility.Internal) {
      throw new ForbiddenException('Taller requiere código.');
    }

    return workshop;
  }

  private validateQuestions(questions: Test['questions']) {
    for (const q of questions) {
      if (q.type === QuestionType.MultipleChoice) {
        if (!q.options || q.options.length < 2) {
          throw new BadRequestException('Pregunta de opción múltiple requiere opciones.');
        }
        if (q.correctOptionIndex === undefined || q.correctOptionIndex === null) {
          throw new BadRequestException('Pregunta de opción múltiple requiere respuesta correcta.');
        }
        if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
          throw new BadRequestException('Índice de respuesta correcta inválido.');
        }
      }

      if (q.type === QuestionType.Open) {
        q.options = undefined;
        q.correctOptionIndex = undefined;
      }
    }
  }

  async create(user: AuthUser, input: {
    workshopId: string;
    title: string;
    description?: string;
    questions: Test['questions'];
  }) {
    const workshop = await this.assertTeacherWorkshopAccess(user, input.workshopId);

    this.validateQuestions(input.questions);

    const created = new this.testModel({
      schoolId: workshop.schoolId,
      workshopId: input.workshopId,
      createdByUserId: user.userId,
      title: input.title,
      description: input.description,
      status: TestStatus.Draft,
      questions: input.questions,
    });

    return created.save();
  }

  async updateDraft(user: AuthUser, testId: string, input: {
    title?: string;
    description?: string;
    questions?: Test['questions'];
  }) {
    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    await this.assertTeacherWorkshopAccess(user, test.workshopId);

    if (test.status !== TestStatus.Draft) {
      throw new BadRequestException('Solo puedes editar un test en borrador.');
    }

    if (user.role !== Role.Admin && test.createdByUserId !== user.userId) {
      throw new ForbiddenException('Solo el creador o admin puede editar este test.');
    }

    if (input.title !== undefined) test.title = input.title;
    if (input.description !== undefined) test.description = input.description;

    if (input.questions !== undefined) {
      this.validateQuestions(input.questions);
      test.questions = input.questions;
    }

    return test.save();
  }

  async submitForReview(user: AuthUser, testId: string) {
    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    await this.assertTeacherWorkshopAccess(user, test.workshopId);

    if (test.status !== TestStatus.Draft) {
      throw new BadRequestException('El test no está en borrador.');
    }

    if (user.role !== Role.Admin && test.createdByUserId !== user.userId) {
      throw new ForbiddenException('Solo el creador o admin puede enviar a revisión.');
    }

    test.status = TestStatus.InReview;
    test.reviewerFeedback = undefined;

    return test.save();
  }

  async approve(user: AuthUser, testId: string, feedback?: string) {
    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (test.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este test.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para aprobar.');
    }

    if (test.status !== TestStatus.InReview) {
      throw new BadRequestException('El test no está en revisión.');
    }

    test.status = TestStatus.Approved;
    test.reviewerFeedback = feedback;
    test.approvedByUserId = user.userId;
    test.approvedAt = new Date();

    return test.save();
  }

  async reject(user: AuthUser, testId: string, feedback?: string) {
    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    const schoolId = this.requireSchoolId(user);
    if (test.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este test.');
    }

    if (![Role.Admin, Role.Reviewer].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para rechazar.');
    }

    if (test.status !== TestStatus.InReview) {
      throw new BadRequestException('El test no está en revisión.');
    }

    test.status = TestStatus.Draft;
    test.reviewerFeedback = feedback;

    return test.save();
  }

  async listForUser(user: AuthUser, workshopId: string) {
    const schoolId = this.requireSchoolId(user);

    if (user.role === Role.Student) {
      await this.assertStudentWorkshopAccess(user, workshopId);
      return this.testModel
        .find({ schoolId, workshopId, status: TestStatus.Approved })
        .select('-questions.correctOptionIndex')
        .sort({ createdAt: -1 })
        .exec();
    }

    if ([Role.Admin, Role.Reviewer].includes(user.role)) {
      return this.testModel.find({ schoolId, workshopId }).sort({ createdAt: -1 }).exec();
    }

    await this.assertTeacherWorkshopAccess(user, workshopId);
    return this.testModel
      .find({ schoolId, workshopId, createdByUserId: user.userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getForTaking(user: AuthUser, testId: string) {
    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    if (user.role === Role.Student) {
      await this.assertStudentWorkshopAccess(user, test.workshopId);
      if (test.status !== TestStatus.Approved) {
        throw new ForbiddenException('Test no disponible.');
      }

      const obj = test.toObject();
      const sanitizedQuestions = obj.questions.map((q: any) => {
        const { correctOptionIndex, ...rest } = q;
        return rest;
      });

      return { ...obj, questions: sanitizedQuestions };
    }

    const schoolId = this.requireSchoolId(user);
    if (test.schoolId !== schoolId) {
      throw new ForbiddenException('No tienes acceso a este test.');
    }

    if (user.role === Role.Teacher) {
      await this.assertTeacherWorkshopAccess(user, test.workshopId);
      if (test.createdByUserId !== user.userId) {
        throw new ForbiddenException('No tienes acceso a este test.');
      }
    }

    return test;
  }

  async submitAttempt(user: AuthUser, testId: string, input: { answers: any[] }) {
    if (user.role !== Role.Student) {
      throw new ForbiddenException('Solo alumnos pueden enviar intentos.');
    }

    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    await this.assertStudentWorkshopAccess(user, test.workshopId);

    if (test.status !== TestStatus.Approved) {
      throw new ForbiddenException('Test no disponible.');
    }

    const schoolId = this.requireSchoolId(user);

    const answersByIndex = new Map<number, any>();
    for (const a of input.answers) {
      answersByIndex.set(a.questionIndex, a);
    }

    let autoScore = 0;
    let needsManualReview = false;

    const normalizedAnswers = test.questions.map((q, idx) => {
      const a = answersByIndex.get(idx);
      if (!a) {
        return { questionIndex: idx };
      }

      if (q.type === QuestionType.MultipleChoice) {
        const selected = a.selectedOptionIndex;
        const correct = q.correctOptionIndex;
        let awarded = 0;
        if (typeof selected === 'number' && typeof correct === 'number' && selected === correct) {
          awarded = q.points;
          autoScore += awarded;
        }
        return { questionIndex: idx, selectedOptionIndex: selected, awardedPoints: awarded };
      }

      needsManualReview = true;
      return { questionIndex: idx, textAnswer: a.textAnswer };
    });

    const attempt = new this.attemptModel({
      schoolId,
      testId,
      workshopId: test.workshopId,
      studentUserId: user.userId,
      answers: normalizedAnswers,
      autoScore,
      manualScore: 0,
      totalScore: autoScore,
      needsManualReview,
      isSubmitted: true,
      submittedAt: new Date(),
    });

    return attempt.save();
  }

  async gradeAttempt(user: AuthUser, attemptId: string, grades: { questionIndex: number; awardedPoints: number }[]) {
    if (![Role.Teacher, Role.Admin].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para calificar.');
    }

    const attempt = await this.attemptModel.findById(attemptId).exec();
    if (!attempt) throw new NotFoundException('Intento no encontrado.');

    const test = await this.testModel.findById(attempt.testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    await this.assertTeacherWorkshopAccess(user, attempt.workshopId);

    if (user.role !== Role.Admin && test.createdByUserId !== user.userId) {
      throw new ForbiddenException('Solo el creador del test o admin puede calificar.');
    }

    const gradeMap = new Map<number, number>();
    for (const g of grades) gradeMap.set(g.questionIndex, g.awardedPoints);

    let manualScore = 0;

    const updatedAnswers = attempt.answers.map((a) => {
      const q = test.questions[a.questionIndex];
      if (!q) return a;
      if (q.type !== QuestionType.Open) return a;

      const awarded = gradeMap.get(a.questionIndex);
      if (awarded === undefined) return a;

      const clamped = Math.max(0, Math.min(q.points, awarded));
      manualScore += clamped;

      return {
        questionIndex: a.questionIndex,
        selectedOptionIndex: a.selectedOptionIndex,
        textAnswer: a.textAnswer,
        awardedPoints: clamped,
      };
    });

    attempt.answers = updatedAnswers as any;
    attempt.manualScore = manualScore;
    attempt.totalScore = attempt.autoScore + manualScore;
    attempt.needsManualReview = false;
    attempt.gradedByUserId = user.userId;
    attempt.gradedAt = new Date();

    return attempt.save();
  }

  async listAttemptsForTeacher(user: AuthUser, testId: string) {
    if (![Role.Teacher, Role.Admin].includes(user.role)) {
      throw new ForbiddenException('No tienes permisos.');
    }

    const test = await this.testModel.findById(testId).exec();
    if (!test) throw new NotFoundException('Test no encontrado.');

    await this.assertTeacherWorkshopAccess(user, test.workshopId);

    if (user.role !== Role.Admin && test.createdByUserId !== user.userId) {
      throw new ForbiddenException('No tienes permisos.');
    }

    return this.attemptModel
      .find({ testId })
      .sort({ submittedAt: -1 })
      .exec();
  }
}
