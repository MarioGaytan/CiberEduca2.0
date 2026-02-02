# CiberEduca - Roadmap y Estado del Proyecto

> **Última actualización:** Febrero 2026  
> **Versión:** 0.1.0 (MVP para secundaria piloto)

---

## 📋 Índice

1. [Contexto del Proyecto](#contexto-del-proyecto)
2. [Estado Actual](#estado-actual)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Visión a Futuro](#visión-a-futuro)
5. [Nuevas Funcionalidades Propuestas](#nuevas-funcionalidades-propuestas)
6. [Priorización y Dificultad](#priorización-y-dificultad)
7. [Consideraciones de Seguridad](#consideraciones-de-seguridad)

---

## 🎯 Contexto del Proyecto

### Origen
Este proyecto nació como parte de una clase de **intervención social** con el objetivo de ayudar a una secundaria específica. La idea es proporcionar una plataforma educativa gamificada que motive a los estudiantes a aprender.

### Público Objetivo Inicial
- **Una secundaria** con aproximadamente **27 salones** (1°, 2° y 3° año)
- Aproximadamente **1,000 alumnos** activos
- Maestros y personal administrativo de la institución

### Filosofía
- **Plataforma cerrada**: Cada escuela accede solo a su contenido
- **Gamificación**: XP, niveles, avatares, medallas y rankings para motivar
- **Seguridad primero**: Público objetivo son menores de edad

---

## ✅ Estado Actual

### Roles de Usuario Implementados

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador del sistema | Todo acceso, gestión de usuarios |
| `reviewer` | Revisor de contenido | Aprobar/rechazar talleres y tests |
| `teacher` | Maestro/Profesor | Crear talleres, tests, colaborar |
| `student` | Alumno | Consumir contenido, realizar tests, ganar XP |

### Módulos Implementados

#### 1. Autenticación (`/auth`)
- ✅ Login con usuario o email
- ✅ Registro de estudiantes
- ✅ JWT con access/refresh tokens
- ✅ Cookies httpOnly seguras
- ✅ Protección de rutas por rol

#### 2. Usuarios (`/users`)
- ✅ CRUD de usuarios (admin)
- ✅ Búsqueda de profesores para colaboraciones
- ✅ Activar/desactivar usuarios
- ✅ Asignación de roles

#### 3. Talleres (`/workshops`)
- ✅ CRUD completo
- ✅ Contenido rico (texto, YouTube, imágenes, encabezados)
- ✅ Flujo de revisión: draft → in_review → approved
- ✅ Colaboradores (editor/viewer)
- ✅ Visibilidad: interna o por código de acceso
- ✅ Soft delete con solicitud de eliminación
- ✅ Historial de cambios

#### 4. Tests (`/tests`)
- ✅ Preguntas múltiple opción y abiertas
- ✅ Puntos por pregunta
- ✅ Media en preguntas (imágenes, videos)
- ✅ Pistas y explicaciones
- ✅ Flujo de revisión igual que talleres
- ✅ Intentos de alumnos
- ✅ Calificación manual de preguntas abiertas

#### 5. Progreso y Gamificación (`/progress`)
- ✅ Sistema de XP (experiencia)
- ✅ Niveles basados en XP
- ✅ Medallas por logros
- ✅ Rankings generales por escuela
- ✅ Rachas de actividad diaria
- ✅ Avatares personalizables
- ✅ Desbloqueos basados en XP

### Sistema de XP Actual (Hardcoded)

```typescript
// Ganancias de XP
- Completar test: 25 XP base + hasta 50 XP por puntaje
- Completar taller: 100 XP
- Medallas: 50-500 XP según tipo

// Medallas disponibles
- first_workshop (50 XP) - Primer taller completado
- workshop_5 (100 XP) - 5 talleres
- workshop_10 (200 XP) - 10 talleres
- workshop_25 (500 XP) - 25 talleres
- perfect_score (75 XP) - 100% en un test
- streak_7 (100 XP) - 7 días seguidos
- streak_30 (300 XP) - 30 días seguidos
- top_10 (150 XP) - Top 10 ranking
- top_3 (250 XP) - Top 3 ranking
- first_place (500 XP) - Primer lugar
```

### Opciones de Avatar (Hardcoded)

```typescript
// Bases de avatar
default (0 XP), cool (100), nerd (200), ninja (500), robot (1000), alien (2000)

// Colores
Índigo (0), Rosa (0), Esmeralda (50), Ámbar (100), Rojo (150), Violeta (200), Cian (300), Dorado (500)

// Accesorios
Lentes (100), Gorro (200), Audífonos (300), Corona (1000), Aureola (2000)

// Marcos
Ninguno (0), Bronce (200), Plata (500), Oro (1000), Diamante (2500), Legendario (5000)
```

### Esquema de Base de Datos

```
MongoDB Collections:
├── users
│   ├── username, email, passwordHash
│   ├── role (admin/reviewer/teacher/student)
│   ├── schoolId
│   └── isActive
│
├── workshops
│   ├── title, description, content[]
│   ├── status (draft/in_review/approved)
│   ├── visibility (internal/code)
│   ├── collaborators[]
│   ├── history[]
│   └── soft delete fields
│
├── tests
│   ├── workshopId, title
│   ├── questions[] (type, points, options, hint, explanation)
│   └── status
│
├── test_attempts
│   ├── studentUserId, testId
│   ├── answers[], totalScore
│   └── gradedAnswers[]
│
└── student_progress
    ├── userId, totalXp, level
    ├── workshopsCompleted[], testsCompleted[]
    ├── medals[], avatar
    └── streak data
```

---

## 🏗️ Arquitectura Técnica

```
CiberEduca2.0/
├── apps/
│   ├── api/          # NestJS Backend
│   │   ├── auth/     # JWT, guards
│   │   ├── users/    # Gestión usuarios
│   │   ├── workshops/# Talleres
│   │   ├── tests/    # Tests y attempts
│   │   ├── progress/ # XP, medallas, ranking
│   │   └── common/   # Roles, decorators
│   │
│   └── web/          # Next.js Frontend
│       ├── app/      # App router (páginas)
│       ├── api/      # Route handlers (proxy)
│       └── _components/
│
├── package.json      # Monorepo con workspaces
└── docker-compose.yml # MongoDB local
```

**Stack:**
- **Backend:** NestJS + Mongoose + MongoDB
- **Frontend:** Next.js 16 + React + TailwindCSS
- **Auth:** JWT (access 15min / refresh 7d) en cookies httpOnly

---

## 🔮 Visión a Futuro

### Rama 1: Plataforma Abierta (Largo Plazo)
> Comunidad de aprendizaje libre, estilo Khan Academy

- Cualquier persona puede crear cuenta
- Creación libre de contenido
- Comunidad de aprendizaje segura
- Juegos educativos
- Marketplace de talleres
- Certificaciones

### Rama 2: Plataforma Cerrada Multi-Escuela (Mediano Plazo)
> Estilo Google Classroom / Microsoft Teams

- Cada escuela es un "tenant" aislado
- Las escuelas no se ven entre sí
- Personal administrativo gestiona su escuela
- Maestros gestionan sus grupos/clases
- Ideal para instituciones educativas

### Enfoque Actual: MVP Escuela Piloto
> Prioridad inmediata para la secundaria específica

---

## 🚀 Nuevas Funcionalidades Propuestas

### 1. Nuevos Roles de Usuario

#### `game_designer` / `xp_moderator` - Diseñador de Experiencia
**Responsabilidades:**
- Configurar valores de XP por acciones
- Definir medallas y sus requisitos
- Diseñar opciones de avatares
- Configurar niveles y desbloqueos
- Crear y configurar juegos educativos (futuro)

**Permisos:**
- Acceso al panel de configuración de gamificación
- CRUD de opciones de avatar
- CRUD de medallas
- Configurar fórmulas de XP
- NO acceso a contenido educativo ni usuarios

#### `school_admin` - Administrador de Escuela
**Responsabilidades:**
- Gestionar usuarios de su escuela
- Crear grupos/clases
- Asignar maestros a grupos
- Ver estadísticas generales
- Configuraciones de la escuela

**Permisos:**
- CRUD usuarios de su schoolId
- CRUD grupos de su escuela
- Ver reportes y analytics

### 2. Sistema de Grupos/Clases

```typescript
// Nuevo schema propuesto
interface ClassGroup {
  _id: string;
  schoolId: string;
  name: string;                    // "Matemáticas 1A"
  description?: string;
  
  // Metadata educativa
  gradeLevel: '1' | '2' | '3';     // Año escolar
  section: string;                  // "A", "B", "C"
  subject?: string;                 // Materia (opcional)
  schoolYear: string;              // "2025-2026"
  
  // Participantes
  teacherUserId: string;           // Maestro titular
  assistantTeacherIds?: string[];  // Maestros auxiliares
  studentUserIds: string[];        // Alumnos del grupo
  
  // Asignaciones
  assignedWorkshops: {
    workshopId: string;
    assignedAt: Date;
    dueDate?: Date;
    isRequired: boolean;
  }[];
  
  // Configuración
  isActive: boolean;
  createdAt: Date;
  createdByUserId: string;
}
```

**Funcionalidades:**
- Admin/school_admin crean grupos
- Asignan maestro titular
- Agregan alumnos (individual o masivo)
- Maestro puede asignar talleres al grupo
- Ver progreso de alumnos del grupo
- Rankings dentro del grupo

### 3. Rankings Específicos

```typescript
// Tipos de ranking propuestos
interface RankingConfig {
  type: 'global' | 'grade' | 'section' | 'group';
  
  // Para ranking por grado
  gradeLevel?: '1' | '2' | '3';
  
  // Para ranking por sección
  section?: string;  // "1A", "2B"
  
  // Para ranking por grupo
  groupId?: string;
  
  // Periodo
  period?: 'all_time' | 'monthly' | 'weekly';
}
```

**Rankings implementables:**
1. **Global de escuela** (actual) - Todos los alumnos
2. **Por generación** - Solo 1°, solo 2°, solo 3°
3. **Por sección** - 1A, 1B, 2A, 2B, etc.
4. **Por grupo/clase** - Matemáticas 1A, Español 2B
5. **Por periodo** - Semanal, mensual, histórico

### 4. Configuración Dinámica de Gamificación

```typescript
// Mover de hardcoded a base de datos
interface GamificationConfig {
  schoolId: string;  // Cada escuela puede tener su config
  
  // XP por acciones
  xpRules: {
    testCompletion: {
      base: number;           // 25
      perScorePercent: number; // 0.5 (50% = 25 extra)
      perfectBonus: number;    // 20
    };
    workshopCompletion: number; // 100
    dailyStreak: number;        // 5 por día
  };
  
  // Medallas configurables
  medals: {
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    condition: {
      type: 'workshops' | 'tests' | 'streak' | 'ranking' | 'score';
      value: number;
    };
  }[];
  
  // Avatares configurables
  avatarOptions: {
    bases: AvatarOption[];
    colors: AvatarOption[];
    accessories: AvatarOption[];
    frames: AvatarOption[];
  };
  
  // Niveles
  levelFormula: {
    type: 'linear' | 'exponential';
    baseXp: number;
    multiplier: number;
  };
}
```

### 5. Información Adicional de Estudiantes

```typescript
// Campos adicionales para User (rol student)
interface StudentProfile {
  gradeLevel: '1' | '2' | '3';
  section: string;           // "A", "B", "C"
  enrollmentYear: string;    // "2024" (año de ingreso)
  studentId?: string;        // Matrícula escolar
  parentEmail?: string;      // Para notificaciones (opcional)
}
```

---

## 📊 Priorización y Dificultad

### Fase 1: Fundamentos (Prioridad ALTA) ⏱️ 2-3 semanas

| Tarea | Dificultad | Impacto | Notas |
|-------|------------|---------|-------|
| Agregar campos studentProfile a User | 🟢 Fácil | Alto | gradeLevel, section |
| Ranking por grado (1°, 2°, 3°) | 🟢 Fácil | Alto | Filtro simple |
| Ranking por sección | 🟢 Fácil | Alto | Filtro compuesto |
| UI para seleccionar ranking | 🟡 Media | Alto | Dropdown en /ranking |

### Fase 2: Grupos/Clases (Prioridad ALTA) ⏱️ 3-4 semanas

| Tarea | Dificultad | Impacto | Notas |
|-------|------------|---------|-------|
| Schema ClassGroup | 🟡 Media | Crítico | Base de todo |
| CRUD Grupos (API) | 🟡 Media | Crítico | |
| UI Admin para crear grupos | 🟡 Media | Alto | Dashboard admin |
| Asignar alumnos a grupos | 🟡 Media | Alto | Bulk add |
| Vista de grupo para maestro | 🟡 Media | Alto | Lista alumnos + progreso |
| Asignar taller a grupo | 🟡 Media | Alto | Tareas |
| Ranking dentro de grupo | 🟢 Fácil | Alto | Ya hay base |

### Fase 3: Roles Nuevos (Prioridad MEDIA) ⏱️ 1-2 semanas

| Tarea | Dificultad | Impacto | Notas |
|-------|------------|---------|-------|
| Agregar rol `school_admin` | 🟢 Fácil | Alto | Solo enum + guards |
| Agregar rol `game_designer` | 🟢 Fácil | Medio | Solo enum + guards |
| Dashboard school_admin | 🟡 Media | Alto | Gestión escuela |
| Dashboard game_designer | 🟡 Media | Medio | Config gamificación |

### Fase 4: Gamificación Dinámica (Prioridad MEDIA) ⏱️ 3-4 semanas

| Tarea | Dificultad | Impacto | Notas |
|-------|------------|---------|-------|
| Schema GamificationConfig | 🟡 Media | Alto | Mover de hardcoded |
| API para config XP | 🟡 Media | Alto | CRUD config |
| API para config medallas | 🟡 Media | Alto | CRUD medallas |
| API para config avatares | 🟡 Media | Alto | CRUD opciones |
| UI editor de gamificación | 🔴 Difícil | Alto | Panel completo |
| Migrar datos existentes | 🟡 Media | Crítico | Script migración |

### Fase 5: Mejoras UX (Prioridad BAJA) ⏱️ Ongoing

| Tarea | Dificultad | Impacto | Notas |
|-------|------------|---------|-------|
| Notificaciones in-app | 🟡 Media | Medio | |
| Email a padres (opcional) | 🟡 Media | Bajo | |
| App móvil (PWA) | 🔴 Difícil | Alto | Futuro |
| Juegos educativos | 🔴 Difícil | Alto | Futuro |

### Resumen de Esfuerzo

```
Dificultad:
🟢 Fácil    = 1-2 días
🟡 Media    = 3-5 días
🔴 Difícil  = 1-2 semanas

Fase 1: ~2 semanas  (MVP rankings)
Fase 2: ~4 semanas  (Sistema de grupos - CRÍTICO)
Fase 3: ~2 semanas  (Nuevos roles)
Fase 4: ~4 semanas  (Gamificación dinámica)

Total MVP completo: ~12 semanas (3 meses)
```

---

## 🔒 Consideraciones de Seguridad

### Público Objetivo: Menores de Edad

#### Prioridades de Seguridad
1. **Datos personales mínimos** - Solo lo necesario
2. **Sin chat directo** - Evitar contacto entre usuarios
3. **Contenido moderado** - Todo pasa por revisión
4. **Sin información sensible expuesta** - Emails ocultos
5. **Acceso controlado** - Sistema cerrado por escuela

#### Medidas Implementadas
- ✅ Autenticación JWT con tokens seguros
- ✅ Cookies httpOnly (no accesibles por JS)
- ✅ Roles y permisos estrictos
- ✅ Revisión obligatoria de contenido
- ✅ schoolId para aislamiento de datos

#### Medidas Pendientes
- ⬜ Rate limiting en APIs
- ⬜ Validación de contenido (filtros de texto)
- ⬜ Logs de auditoría más detallados
- ⬜ 2FA para roles administrativos
- ⬜ Política de contraseñas más estricta
- ⬜ Moderación de imágenes subidas

### Aislamiento Multi-Escuela (Futuro)

```typescript
// Cada request debe validar schoolId
// Usuarios solo ven datos de su escuela
// Admins de escuela solo gestionan su escuela
// Super-admin (plataforma) puede ver todo

middleware: validateSchoolAccess(req.user.schoolId, resource.schoolId)
```

---

## 📝 Notas de Implementación Sugeridas

### Orden Recomendado de Desarrollo

1. **Agregar campos de estudiante** (gradeLevel, section) al schema User
2. **Rankings filtrados** - Implementar filtros en endpoint existente
3. **Schema y CRUD de grupos** - Base para asignaciones
4. **Dashboard de maestro** - Ver sus grupos y alumnos
5. **Asignación de talleres** - Maestro asigna a grupo
6. **Nuevos roles** - school_admin, game_designer
7. **Config dinámica** - Mover gamificación a BD

### Migración de Datos

Al agregar campos nuevos a User:
```javascript
// Script de migración
db.users.updateMany(
  { role: 'student', gradeLevel: { $exists: false } },
  { $set: { gradeLevel: '1', section: 'A' } }
);
```

---

## 🎮 Ideas Futuras (Backlog)

- [ ] Mini-juegos educativos
- [ ] Logros/achievements más elaborados
- [ ] Tienda virtual con monedas
- [ ] Eventos temporales (competencias)
- [ ] Integración con calendarios escolares
- [ ] Reportes PDF para padres
- [ ] API pública para integraciones
- [ ] Modo offline (PWA)
- [ ] Accesibilidad (WCAG)
- [ ] Internacionalización (i18n)

---

*Este documento es una guía viva. Actualizar conforme el proyecto evolucione.*
