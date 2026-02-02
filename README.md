# CiberEduca 2.0

**Plataforma educativa gamificada para la enseñanza de ciberseguridad**

Sistema integral de aprendizaje que combina contenido educativo sobre seguridad informática con elementos de gamificación para aumentar el engagement y retención de los estudiantes.

## 🎯 Propósito del Proyecto

CiberEduca 2.0 tiene como objetivo democratizar la educación en ciberseguridad mediante:

- **Aprendizaje interactivo**: Talleres y evaluaciones que enseñan conceptos de seguridad informática de forma práctica
- **Gamificación**: Sistema de XP, niveles, medallas y avatares personalizables que motivan el progreso continuo
- **Gestión escolar**: Panel de administración para profesores y administradores que permite gestionar estudiantes, contenido y configuraciones
- **Personalización**: Avatares DiceBear configurables como recompensa por el progreso del estudiante

## 🛠️ Stack Tecnológico

### Backend (API)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NestJS** | 11.x | Framework backend modular y escalable |
| **MongoDB** | 8.x | Base de datos NoSQL con Mongoose ODM |
| **Passport JWT** | 4.x | Autenticación basada en tokens |
| **bcrypt** | 6.x | Hash seguro de contraseñas |
| **class-validator** | 0.14.x | Validación de DTOs |
| **Helmet** | 8.x | Seguridad de headers HTTP |
| **Throttler** | 6.x | Rate limiting |

### Frontend (Web)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 16.x | Framework React con SSR/SSG |
| **React** | 19.x | Biblioteca UI |
| **TailwindCSS** | 4.x | Estilos utility-first |
| **Lucide React** | 0.563.x | Iconografía SVG |
| **TypeScript** | 5.x | Tipado estático |

### Sistema de Avatares
| Tecnología | Propósito |
|------------|-----------|
| **DiceBear API** | 31 estilos de avatares personalizables |
| **SVG dinámicos** | Generación en tiempo real |
| **Sistema de desbloqueo** | Progresión basada en XP y nivel |

### Infraestructura
| Tecnología | Propósito |
|------------|-----------|
| **npm Workspaces** | Monorepo management |
| **Concurrently** | Desarrollo paralelo API + Web |

## 📁 Estructura del Proyecto

```
CiberEduca2.0/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/           # Autenticación JWT
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   ├── workshops/      # Talleres educativos
│   │   │   ├── gamification/   # XP, niveles, medallas, avatares
│   │   │   │   ├── schemas/    # Modelos Mongoose
│   │   │   │   └── scripts/    # Sync DiceBear
│   │   │   └── schools/        # Multi-tenancy escolar
│   │   └── test/
│   │
│   └── web/                    # Frontend Next.js
│       ├── src/
│       │   └── app/
│       │       ├── admin/      # Panel de administración
│       │       │   └── experiencia/  # Config gamificación
│       │       ├── perfil/     # Perfil de usuario
│       │       └── _components/
│       │           └── avatar/ # Editor de avatares
│       └── public/
│
├── .env.example                # Variables de entorno ejemplo
├── package.json                # Workspace root
└── README.md
```

## 🚀 Instalación

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local o Atlas)

### 1. Clonar el repositorio

```bash
git clone https://github.com/MarioGaytan/CiberEduca2.0.git
cd CiberEduca2.0
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
```

**Variables requeridas:**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cibereduca

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui
JWT_EXPIRES_IN=7d

# API
PORT=3001

# School (multi-tenancy)
DEFAULT_SCHOOL_ID=default
```

### 4. Sincronizar estilos de DiceBear

```bash
npm run sync-dicebear -w api
```

### 5. Sembrar datos iniciales (opcional)

```bash
npm run seed -w api
```

### 6. Iniciar en modo desarrollo

```bash
# Ambos servicios (API + Web)
npm run dev

# Solo API (puerto 3001)
npm run dev -w api

# Solo Web (puerto 3000)
npm run dev -w web
```

## 📡 API Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registro (si habilitado)

### Usuarios
- `GET /users/me` - Perfil actual
- `PUT /users/me` - Actualizar perfil

### Gamificación
- `GET /gamification/progress` - Progreso del estudiante
- `GET /gamification/config` - Configuración de la escuela
- `GET /gamification/dicebear/styles` - Estilos de avatar disponibles
- `GET /gamification/dicebear/styles/:id/user/:xp/:level` - Opciones con estado de desbloqueo

### Talleres
- `GET /workshops` - Lista de talleres
- `POST /workshops/:id/complete` - Marcar como completado

## 🎮 Sistema de Gamificación

### Progresión
- **XP (Experience Points)**: Se ganan al completar talleres y evaluaciones
- **Niveles**: Calculados según XP total con multiplicador exponencial
- **Medallas**: Logros por hitos específicos

### Avatares DiceBear
- **31 estilos** disponibles (Adventurer, Avataaars, Bottts, etc.)
- **2,500+ opciones** de personalización
- **Sistema de desbloqueo** basado en XP y nivel
- **Configuración por escuela** para administradores

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `student` | Ver contenido, completar talleres, personalizar avatar |
| `teacher` | Todo de student + ver progreso de estudiantes |
| `experienceManager` | Todo de teacher + configurar gamificación |
| `admin` | Acceso total al sistema |

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test -w api

# Tests con coverage
npm run test:cov -w api

# Tests e2e
npm run test:e2e -w api
```

## 📦 Build para Producción

```bash
# Build de ambos workspaces
npm run build

# Solo API
npm run build -w api

# Solo Web
npm run build -w web
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados.

---

**Desarrollado con ❤️ para la educación en ciberseguridad**
