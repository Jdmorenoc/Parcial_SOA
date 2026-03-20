# Sistema de Autenticación - SPA con React

## 📌 Descripción del Proyecto

Este proyecto es una aplicación web de una sola página (SPA) desarrollada con React que implementa un completo sistema de autenticación. La aplicación cuenta con cuatro vistas principales: LoginPage, RegisterPage, ForgotPage y ResetPage. 

El enfoque de este proyecto está en demostrar competencias en **diseño de interfaces**, **navegación fluida entre vistas** y **manejo correcto de formularios con validaciones** bajo una arquitectura de Single Page Application. La aplicación se desarrolló siguiendo buenas prácticas de desarrollo frontend y proporciona una experiencia de usuario coherente y profesional.

**Nota:** Este es un proyecto educativo sin integración con backend. Las validaciones se realizan en el cliente y los datos se registran en consola para propósitos de demostración.

---

## Equipo de Desarrollo

| Integrante | Responsabilidad |
|-----------|-----------------|
| **Juan Diego Moreno** | LoginPage - Vista de inicio de sesión |
| **Angel Alfredo Urrego** | RegisterPage - Vista de registro de nuevos usuarios |
| **Andres Felipe Rojas** | ForgotPage y ResetPage - Recuperación y restablecimiento de contraseña |

---

## 🛠️ Tecnologías Utilizadas

- **React** (v19.2.4) - Biblioteca JavaScript para construcción de interfaces de usuario
- **React Router DOM** (v7.13.1) - Enrutamiento declarativo para navegación entre componentes
- **Vite** (v8.0.1) - Herramienta de build rápida y moderna
- **JavaScript ES6+** - Lenguaje de programación
- **CSS3** - Estilos y diseño responsive
- **ESLint** (v9.39.4) - Herramienta para validación de código

---

## 📂 Estructura del Proyecto

```
parcial/
│
├── public/                    # Archivos estáticos públicos
│
├── src/
│   ├── login_menu/
│   │   ├── LoginPage.jsx      # Componente de inicio de sesión
│   │   └── LoginPage.css      # Estilos de LoginPage
│   │
│   ├── register_menu/
│   │   ├── RegisterPage.jsx   # Componente de registro
│   │   └── RegisterPage.css   # Estilos de RegisterPage
│   │
│   ├── forgot_menu/
│   │   ├── ForgotPage.jsx     # Componente de recuperación
│   │   └── ForgotPage.css     # Estilos de ForgotPage
│   │
│   ├── reset_menu/
│   │   ├── ResetPage.jsx      # Componente de restablecimiento
│   │   └── ResetPage.css      # Estilos de ResetPage
│   │
│   ├── App.jsx                # Componente principal con rutas
│   ├── App.css                # Estilos globales
│   ├── index.css              # Estilos base
│   ├── main.jsx               # Punto de entrada de la aplicación
│   └── assets/                # Recursos estáticos (imágenes, iconos, etc)
│
├── index.html                 # Archivo HTML principal
├── package.json               # Dependencias y scripts
├── vite.config.js             # Configuración de Vite
├── eslint.config.js           # Configuración de ESLint
└── README.md                  # Este archivo

```

---

## Detalles de las Vistas
### 1. LoginPage - Inicio de Sesión ✅

**Ubicación:** `/` o `/login`

**Campos del formulario:**
- Correo Electrónico
- Contraseña

**Validaciones implementadas:**
- Email obligatorio con formato válido
- Contraseña obligatoria con mínimo 6 caracteres
- Mensajes de error dinámicos que desaparecen al escribir

**Funcionalidades:**
- Navegación a RegisterPage ("¿No tienes cuenta?")
- Navegación a ForgotPage ("¿Olvidaste tu contraseña?")
- Formulario controlado con estado (useState)
- Log de datos en consola al enviar

**Responsable:** Juan Diego Moreno

---

### 2. RegisterPage - Registro de Usuario

**Ubicación:** `/register`

**Campos esperados:**
- Nombre completo
- Correo Electrónico
- Contraseña
- Confirmación de contraseña

**Validaciones esperadas:**
- Campos obligatorios
- Formato válido de email
- Contraseña con requisitos mínimos
- Contraseñas coincidentes

**Responsable:** Angel Alfredo Urrego

---

### 3. ForgotPage - Recuperación de Contraseña

**Ubicación:** `/forgot`

**Campos esperados:**
- Correo Electrónico para recuperación

**Validaciones esperadas:**
- Email obligatorio
- Formato válido de email
- Mensaje de confirmación

**Responsable:** Andres Felipe Rojas

---

### 4. ResetPage - Restablecimiento de Contraseña

**Ubicación:** `/reset`

**Campos esperados:**
- Código de verificación
- Nueva contraseña
- Confirmación de contraseña

**Validaciones esperadas:**
- Validación de código
- Requisitos mínimos de contraseña
- Confirmación de contraseña coincidente

**Responsable:** Andres Felipe Rojas

---

## ⚙️ Instalación y Ejecución

### Requisitos previos

Antes de empezar, asegúrate de tener instalado:
- **Node.js** versión 16 o superior
- **npm** (que viene incluido con Node.js)
- **Git** para clonar el repositorio

### Pasos para la instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Jdmorenoc/Parcial_SOA.git
   cd Parcial_SOA/parcial
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Verificar la instalación:**
   ```bash
   npm --version
   node --version
   ```

### Ejecución en entorno local

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abrir en el navegador:**
   - El servidor arrancará normalmente en `http://localhost:5173/`
   - Abre esa URL en tu navegador web

3. **El LoginPage se cargará automáticamente** como vista principal

---

## Características Clave

### Formularios Controlados
Cada vista utiliza el hook `useState` de React para mantener un estado controlado del formulario, permitiendo actualizaciones en tiempo real y validación dinámica.

### Validaciones en Cliente
Se implementan validaciones básicas incluyendo:
- Campos obligatorios
- Validación de formato de email
- Validación de longitud de contraseña
- Mensajes de error claros y útiles

### Navegación Fluida
Con React Router DOM, los usuarios pueden navegar entre vistas sin referenciar la página, manteniendo el estado y proporcionando una experiencia suave.

### Diseño Responsivo
La interfaz está optimizada para funcionar correctamente en diferentes tamaños de pantalla, desde dispositivos móviles hasta computadoras de escritorio.

### Paleta de Colores Coherente
Se utiliza un gradiente azul profesional y amigable:
- Fondo: Blanco con toque azul claro (#f5f7ff)
- Primario: Azul (#4A90E2 → #2E5C8A)
- Error: Rojo (#e74c3c)

---

## Verificación y Pruebas

Para probar la aplicación:

1. **Completar un formulario correctamente:**
   - El formulario debe aceptar los datos y mostrar un log en consola (F12)
   - Mensaje esperado: `Datos enviados: {email: "...", password: "..."}`

2. **Probar validaciones:**
   - Dejar campos en blanco
   - Ingresar email con formato incorrecto
   - Ingresar contraseña con menos de 6 caracteres
   - Verificar que aparezcan mensajes de error

3. **Probar navegación:**
   - Usar los enlaces para navegar entre vistas
   - Verificar que cada vista se carga correctamente

---

## Documentación Adicional

Para más información sobre las tecnologías utilizadas:
- **React:** https://react.dev/
- **React Router:** https://reactrouter.com/
- **Vite:** https://vitejs.dev/
- **JavaScript MDN:** https://developer.mozilla.org/es/

---

## ✅ Estado del Proyecto

- **LoginPage:** ✅ Completada
- **RegisterPage:** ✅ Completada
- **ForgotPage:** ✅ Completada
- **ResetPage:** ✅ Completada

---

**Última actualización:** Marzo 2026  
**Rama actual:** develop  
**Rama principal:** main
