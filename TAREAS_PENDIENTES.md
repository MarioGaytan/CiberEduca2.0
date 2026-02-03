# CiberEduca - Tareas Pendientes UI/UX

> **Fecha de análisis:** Febrero 2026  
> **Prioridades:** 🔴 Alta | 🟡 Media | 🟢 Baja

---

## 📋 Resumen del Análisis

### Estructura Actual
- **Frontend:** Next.js 16 + React + TailwindCSS
- **Backend:** NestJS + Mongoose + MongoDB
- **Auth:** JWT con cookies httpOnly
- **Roles:** admin, reviewer, teacher, student, experience_manager

### Componentes Principales Analizados
- `app-chrome.tsx` - Navbar y Sidebar
- `page.tsx` (raíz) - Landing page
- `login/page.tsx` - Inicio de sesión
- `registro/page.tsx` - Registro de estudiantes
- `perfil/page.tsx` - Perfil de usuario
- `dashboard/page.tsx` - Panel de staff
- `home/page.tsx` - Inicio de estudiantes
- `talleres/page.tsx` - Lista de talleres

---

## 🔴 PRIORIDAD ALTA

### 1. ✅ Términos y Condiciones en Registro
**Archivo:** `apps/web/src/app/registro/page.tsx`

**Problema:** No existe aceptación de términos y condiciones al registrarse.

**Tareas:**
- [x] Crear página `/terminos` con términos y condiciones completos
- [x] Crear página `/privacidad` con política de privacidad
- [x] Agregar checkbox obligatorio en formulario de registro
- [ ] Agregar campo `acceptedTermsAt: Date` al schema de User en backend (opcional, para auditoría)
- [x] Validar aceptación de términos en frontend
- [x] Incluir información según leyes mexicanas:
  - Ley Federal de Protección de Datos Personales (LFPDPPP)
  - Aviso de privacidad obligatorio
  - Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
  - Consentimiento para menores de edad (requiere padre/tutor)

**Contenido requerido para términos:**
```
- Uso de datos personales
- Cookies de sesión
- Almacenamiento seguro de contraseñas
- Edad mínima / consentimiento parental
- Reglas de uso de la plataforma
- Propiedad intelectual del contenido
- Limitación de responsabilidad
```

---

### 2. ✅ Footer Global con Información Legal
**Archivo:** `apps/web/src/app/_components/app-chrome.tsx`

**Problema:** No existe footer en ninguna página.

**Tareas:**
- [x] Crear componente `Footer.tsx`
- [x] Agregar al layout (app-chrome.tsx y páginas públicas)
- [x] Incluir enlaces a:
  - Términos y Condiciones
  - Política de Privacidad
  - Aviso de Cookies
  - Contacto / Soporte
- [x] Mostrar información de copyright
- [ ] Versión de la plataforma (opcional)

**Diseño sugerido:**
```tsx
// Footer minimalista que combine con el diseño actual
<footer className="border-t border-white/10 bg-zinc-950/50 py-6 mt-auto">
  <div className="mx-auto max-w-7xl px-6">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-xs text-zinc-500">
        © 2026 CiberEduca. Todos los derechos reservados.
      </div>
      <div className="flex gap-4 text-xs text-zinc-400">
        <Link href="/terminos">Términos</Link>
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/cookies">Cookies</Link>
      </div>
    </div>
  </div>
</footer>
```

---

### 3. ✅ Edición de Perfil para Todos los Usuarios
**Archivos:** 
- `apps/web/src/app/perfil/page.tsx`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.controller.ts`

**Problema:** 
- Solo estudiantes pueden ver estadísticas en perfil
- Maestros y admin NO pueden modificar su información
- Nadie puede cambiar nombre de usuario ni contraseña

**Tareas:**
- [x] **Backend - Crear endpoints:**
  - `PATCH /api/users/me/profile` - Actualizar username/email
  - `PATCH /api/users/me/password` - Cambiar contraseña (requiere contraseña actual)
  
- [x] **Backend - Agregar métodos en UsersService:**
  ```typescript
  async updateProfile(userId: string, data: { username?: string; email?: string })
  async changePassword(userId: string, currentPassword: string, newPassword: string)
  ```

- [x] **Frontend - Agregar sección de edición en perfil:**
  - Formulario para cambiar username
  - Formulario para cambiar email
  - Formulario para cambiar contraseña (actual + nueva + confirmar)
  - Validaciones en frontend
  - Mensajes de éxito/error

- [x] **UI para staff (teacher/admin/reviewer):**
  - Mostrar formulario de edición de perfil (pestaña "Ajustes")
  - [ ] Opción de subir foto de perfil (opcional, futuro)

---

## 🟡 PRIORIDAD MEDIA

### 4. ✅ Buscadores Sincronizados
**Archivos:**
- `apps/web/src/app/_components/app-chrome.tsx` (navbar search)
- `apps/web/src/app/talleres/page.tsx` (local search)

**Problema:** Había dos buscadores que no estaban sincronizados.

**Solución implementada (Opción C - Sincronizar):**
- [x] Mantener ambos buscadores
- [x] El buscador del navbar actualiza query params (`/talleres?q=...`)
- [x] El buscador local de talleres se inicializa con el query param de la URL
- [x] Ambos buscadores funcionan de forma independiente pero sincronizada

---

### 5. ✅ Actualizar Landing Page (página raíz)
**Archivo:** `apps/web/src/app/page.tsx`

**Problema:** La información está desactualizada y falta información legal.

**Tareas:**
- [x] Actualizar sección "¿Cómo funciona?" con información precisa
- [x] Agregar sección de seguridad y privacidad:
  - "Tus datos están seguros"
  - "Plataforma cerrada solo para tu escuela"
  - "Sin publicidad ni terceros"
- [x] Agregar información sobre cookies de sesión
- [x] Agregar badge/sello de "Cumplimos con LFPDPPP"
- [ ] Agregar FAQ básico (opcional, futuro)
- [x] Enlazar a términos y privacidad

---

### 6. ✅ Política de Cookies
**Nueva página:** `apps/web/src/app/cookies/page.tsx`

**Tareas:**
- [x] Crear página con información de cookies usadas:
  - Cookie de access token (httpOnly)
  - Cookie de refresh token (httpOnly)
  - Preferencias de sidebar (localStorage)
- [x] Explicar que NO se usan cookies de terceros ni tracking
- [ ] Banner de cookies al primer acceso (opcional pero recomendado)
- [ ] Almacenar preferencia de cookies en localStorage

---

### 7. ✅ Mejoras en Dashboard de Staff
**Archivo:** `apps/web/src/app/dashboard/page.tsx`

**Tareas:**
- [x] Agregar estadísticas más detalladas por rol:
  - **Admin**: Total usuarios, usuarios por rol, solicitudes pendientes, actividad reciente
  - **Teacher**: Mis talleres, borradores, en revisión, intentos por calificar
  - **Reviewer**: Pendientes de revisión, solicitudes, revisados esta semana
  - **Experience Manager**: Acceso a configuración de gamificación
- [x] Acceso rápido a funciones comunes (acciones rápidas)
- [x] Notificaciones pendientes (badges con contadores)
- [x] Actividad reciente (para admin)

**Archivos creados:**
- `apps/api/src/dashboard/dashboard.module.ts`
- `apps/api/src/dashboard/dashboard.service.ts`
- `apps/api/src/dashboard/dashboard.controller.ts`
- `apps/web/src/app/api/dashboard/stats/route.ts`

---

### 8. Vista de Perfil para Staff más Completa
**Archivo:** `apps/web/src/app/perfil/page.tsx`

**Problema actual:** Staff solo ve su rol y accesos rápidos, muy básico.

**Tareas:**
- [ ] Mostrar estadísticas para teachers:
  - Talleres creados
  - Tests creados
  - Alumnos que han completado sus tests
  - Intentos pendientes de calificar
- [ ] Mostrar estadísticas para admin:
  - Total de usuarios
  - Talleres aprobados/pendientes
  - Actividad reciente

---

## 🟢 PRIORIDAD BAJA

### 9. Buscadores Específicos por Sección
**Archivos varios**

**Tareas:**
- [x] `/admin/usuarios` - Agregar buscador de usuarios por nombre/email/rol ✅
- [ ] `/admin/revision` - Filtrar por estado, autor, fecha
- [ ] `/intentos` - Buscar por alumno, test, fecha

---

### 10. Mejoras de Accesibilidad
**Tareas:**
- [ ] Agregar `aria-labels` faltantes
- [ ] Mejorar contraste en algunos textos zinc-500
- [ ] Soporte para navegación por teclado completa
- [ ] Skip links para lectores de pantalla

---

### 11. PWA y Modo Offline (Futuro)
- [ ] Configurar service worker
- [ ] Manifest.json para instalación
- [ ] Caché de contenido estático

---

### 12. Internacionalización (Futuro)
- [ ] Preparar estructura para i18n
- [ ] Extraer strings a archivos de traducción

---

## 📁 Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `apps/web/src/app/terminos/page.tsx` | Página de Términos y Condiciones |
| `apps/web/src/app/privacidad/page.tsx` | Política de Privacidad |
| `apps/web/src/app/cookies/page.tsx` | Política de Cookies |
| `apps/web/src/app/_components/Footer.tsx` | Componente Footer global |
| `apps/web/src/app/_components/CookieBanner.tsx` | Banner de cookies (opcional) |
| `apps/api/src/users/dto/update-profile.dto.ts` | DTO para actualizar perfil |
| `apps/api/src/users/dto/change-password.dto.ts` | DTO para cambiar contraseña |

---

## 📝 Endpoints API a Crear

| Método | Ruta | Descripción |
|--------|------|-------------|
| `PATCH` | `/api/users/me/profile` | Actualizar username/email |
| `PATCH` | `/api/users/me/password` | Cambiar contraseña |
| `GET` | `/api/users/me/stats` | Estadísticas del usuario (staff) |

---

## 🔒 Consideraciones Legales México (LFPDPPP)

### Aviso de Privacidad Obligatorio
Debe incluir:
1. Identidad del responsable (escuela/plataforma)
2. Datos personales que se recaban
3. Finalidades del tratamiento
4. Transferencias de datos (si aplica)
5. Derechos ARCO del titular
6. Mecanismo para ejercer derechos
7. Procedimiento de cambios al aviso

### Datos de Menores
- Requiere consentimiento de padre/tutor
- Considerar agregar campo para email de padre/tutor
- Minimizar datos recabados

### Cookies
- Solo cookies técnicas necesarias = no requiere consentimiento
- Si se agregan analytics = requiere consentimiento previo

---

## ⏱️ Estimación de Tiempo

| Tarea | Estimación |
|-------|------------|
| Términos y Condiciones + Privacidad | 2-3 días |
| Footer global | 2-4 horas |
| Edición de perfil (backend + frontend) | 2-3 días |
| Unificar buscadores | 4-6 horas |
| Actualizar landing page | 1 día |
| Política de cookies | 4-6 horas |
| Mejoras dashboard staff | 2-3 días |
| **Total estimado** | **~2 semanas** |

---

*Documento generado automáticamente. Actualizar conforme se completen las tareas.*
