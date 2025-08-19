# Chat App - Examen de Recuperación

Aplicación de chat con Firebase, Ionic y Angular.

## Funcionalidades

✅ **Login y Registro** - Crear cuenta e iniciar sesión  
✅ **Chat en tiempo real** - Enviar mensajes instantáneos  
✅ **Enviar fotos** - Tomar fotos o seleccionar de galería  
✅ **Compartir ubicación** - Enviar tu ubicación GPS  
✅ **Ver mapas** - Abrir ubicaciones en Google Maps  
✅ **Borrar historial** - Limpiar todos los mensajes  

## Tecnologías

- Ionic 8
- Angular 20
- Firebase (Auth + Firestore)
- Capacitor

## Instalación

```bash
# Clonar proyecto
git clone https://github.com/SoyAndersonJoel/examenRecuperacion.git
cd examenRecuperacion

# Instalar dependencias
npm install

# Ejecutar
npx ionic serve
```

## Configuración Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Activar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Copiar config en `src/environments/firebase.config.ts`

**Nota**: Este proyecto usa Firebase gratuito, las imágenes se comprimen automáticamente.

## Generar APK

```bash
# Compilar
npx ionic build --prod

# Android
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

En Android Studio: **Build → Build APK**

## Cómo usar

1. **Registrarse** - Crear cuenta con email y contraseña
2. **Chat** - Escribir mensajes y presionar Enter
3. **Adjuntar** - Botón 📎 para fotos o ubicación
4. **Mapas** - Botón "Ver en mapa" en ubicaciones
5. **Opciones** - Menú ⋮ para borrar historial o salir

## Desarrollador

Anderson Joel  
GitHub: [@SoyAndersonJoel](https://github.com/SoyAndersonJoel)
