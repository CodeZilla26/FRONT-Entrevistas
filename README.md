# Sistema de Entrevistas

Sistema completo de entrevistas desarrollado con Next.js, React, TypeScript y Tailwind CSS.

## 🚀 Instalación

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd interview-system
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
# Copiar plantilla de variables de entorno
npm run env:setup

# Editar .env con tus valores
# Asegúrate de configurar:
# - NEXT_PUBLIC_API_BASE_URL
# - INTERVIEWS_JWT  
# - OPENROUTER_API_KEY
```

4. **Validar configuración:**
```bash
npm run env:validate
```

5. **Ejecutar el proyecto:**
```bash
npm run dev
```

6. **Abrir en el navegador:**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
interview-system/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── interview/
│   │   │   └── InterviewPanel.tsx
│   │   ├── layout/
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useInterview.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── constants.ts
│   │   └── storage.ts
│   └── types/
│       └── index.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

## 🔐 Credenciales de Acceso

### Postulante:
- **Email:** `postulante@email.com`
- **Password:** `user123`

### Reclutador:
- **Email:** `reclutador@empresa.com`
- **Password:** `admin123`

## 🔐 Variables de Entorno

El sistema requiere las siguientes variables de entorno configuradas en `.env`:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_TIMEOUT=120000

# JWT Token (obtener del backend)
INTERVIEWS_JWT=tu_jwt_token_aqui

# OpenRouter AI (para generación de preguntas)
OPENROUTER_API_KEY=tu_api_key_de_openrouter
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEXT_PUBLIC_OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=Interview System AI

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**📖 Documentación completa:** Ver `ENVIRONMENT_SETUP.md` para instrucciones detalladas.

## ✨ Características

- **Autenticación** con diferentes roles (postulante/reclutador)
- **Entrevistas interactivas** con síntesis de voz
- **Grabación de video/audio** durante la entrevista
- **Timer y progreso visual** en tiempo real
- **Variables de entorno** para configuración segura
- **Interfaz responsive** y moderna
- **Notificaciones toast** para feedback
- **Tema oscuro** profesional

## 🛠️ Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Lucide React** - Iconos
- **Web APIs** - MediaRecorder, SpeechSynthesis

## 📱 Funcionalidades

### Para Postulantes:
- Iniciar entrevista con cámara/micrófono
- Escuchar preguntas con síntesis de voz
- Timer de respuesta por pregunta
- Progreso visual de la entrevista
- Estado de completación persistente

### Para Reclutadores:
- Panel de administración (en desarrollo)
- Gestión de participantes
- Revisión de resultados

## 🎨 Personalización

El sistema utiliza un esquema de colores oscuro profesional basado en Tailwind CSS. Puedes personalizar los colores editando `tailwind.config.ts`.

## 🔧 Scripts Disponibles

### Desarrollo:
```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar build
npm run start

# Linting
npm run lint
```

### Variables de Entorno:
```bash
# Configurar variables de entorno por primera vez
npm run env:setup

# Verificar qué variables están configuradas
npm run env:check

# Validar que todas las variables requeridas estén presentes
npm run env:validate
```

## 📚 Documentación Adicional

- `ENVIRONMENT_SETUP.md` - Guía completa de configuración de variables de entorno
- `README_ENV.md` - Documentación de la migración a variables de entorno
- `.env.example` - Plantilla de variables de entorno

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Configura las variables de entorno (`npm run env:setup`)
4. Valida la configuración (`npm run env:validate`)
5. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
6. Push a la rama (`git push origin feature/nueva-funcionalidad`)
7. Abre un Pull Request
