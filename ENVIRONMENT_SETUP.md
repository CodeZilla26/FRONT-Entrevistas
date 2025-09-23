# 🔧 Environment Variables Setup

Este documento explica cómo configurar las variables de entorno para el sistema de entrevistas.

## 📋 Configuración Inicial

### 1. Crear archivo .env

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar Variables Requeridas

Edita el archivo `.env` y configura las siguientes variables:

#### 🔗 Backend API Configuration
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_TIMEOUT=120000
```

#### 🔑 JWT Tokens
```env
INTERVIEWS_JWT=tu_jwt_token_aqui
```
> ⚠️ **Importante**: Reemplaza con tu token JWT real del backend

#### 🤖 OpenRouter AI Configuration
```env
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=tu_api_key_de_openrouter_aqui
NEXT_PUBLIC_OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=Interview System AI
```
> ⚠️ **Importante**: Obtén tu API key de [OpenRouter](https://openrouter.ai/)

#### 🌐 Frontend Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔒 Seguridad

### Variables Públicas vs Privadas

- **NEXT_PUBLIC_**: Variables accesibles en el cliente (browser)
- **Sin prefijo**: Variables solo accesibles en el servidor

### Archivos de Entorno

- `.env` - Variables locales (NO subir a git)
- `.env.example` - Plantilla para otros desarrolladores (SÍ subir a git)
- `.env.local` - Variables locales específicas (NO subir a git)
- `.env.production` - Variables de producción (NO subir a git)

## 🚀 Uso en Desarrollo

### Verificar Variables

El sistema incluye validación automática. Si faltan variables requeridas, verás advertencias en la consola:

```
⚠️ Missing environment variables: ['INTERVIEWS_JWT', 'OPENROUTER_API_KEY']
Please check your .env file and ensure all required variables are set.
```

### Reiniciar Servidor

Después de cambiar variables de entorno, reinicia el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
```

## 📁 Estructura de Archivos

```
interview-system/
├── .env                 # Variables locales (NO subir a git)
├── .env.example        # Plantilla (SÍ subir a git)
├── .gitignore          # Incluye .env
├── src/
│   ├── config.ts       # Configuración centralizada
│   └── server/
│       └── config.ts   # Configuración del servidor
```

## 🔧 Variables por Entorno

### Desarrollo Local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Producción
```env
NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 🛠️ Solución de Problemas

### Error: "Missing environment variables"
1. Verifica que el archivo `.env` existe
2. Confirma que las variables están definidas
3. Reinicia el servidor de desarrollo

### Error: "API calls failing"
1. Verifica `NEXT_PUBLIC_API_BASE_URL`
2. Confirma que el backend está corriendo
3. Revisa el token JWT

### Error: "OpenRouter API not working"
1. Verifica `OPENROUTER_API_KEY`
2. Confirma que tienes créditos en OpenRouter
3. Revisa la configuración de CORS

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [JWT.io](https://jwt.io/) - Para decodificar tokens JWT

## 🔄 Migración desde Hardcoded Values

Si vienes de una versión anterior con valores hardcodeados:

1. ✅ Los archivos ya fueron actualizados para usar variables de entorno
2. ✅ Los valores anteriores están en el `.env` como fallback
3. ✅ El sistema es compatible con ambas configuraciones

### Archivos Actualizados:
- `src/config.ts` - Configuración centralizada
- `src/server/config.ts` - Configuración del servidor
- `src/hooks/useInterview.ts` - URLs dinámicas
- `src/context/AuthContext.tsx` - URLs dinámicas
- `src/components/recruiter/RecruiterPanel.tsx` - URLs dinámicas
- `src/components/participant/ParticipantInterviewStatus.tsx` - URLs dinámicas
- `src/components/interview/InterviewPanel.tsx` - URLs dinámicas
