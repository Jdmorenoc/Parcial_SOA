# Autenticación con Email y Contraseña

El método tradicional de registro que ofrece mayor control sobre los datos del usuario.

## Implementación

1.  **Registro (`signup`)**:
    *   Valida manualmente que el correo no exista en Firestore antes de llamar a Firebase Auth.
    *   Crea el usuario en Firebase Authentication.
    *   Guarda el perfil extendido (nombre, apellidos) en la colección `users` de Firestore.
2.  **Inicio de Sesión (`signin`)**:
    *   Verifica las credenciales.
    *   Mapea errores como "contraseña incorrecta" o "usuario no encontrado" a mensajes amigables.
3.  **Recuperación de Contraseña**:
    *   Se utiliza el método `sendPasswordResetEmail` de Firebase Auth.
    *   El usuario recibe un correo electrónico oficial de Firebase con un enlace seguro para restablecer su contraseña sin necesidad de recordar la anterior.
4.  **Seguridad**:
    *   Implementa una política de contraseñas de al menos 6 caracteres (por Firebase).
    *   El sistema de **Auto-Cierre por Inactividad** monitorea las sesiones iniciadas por este método igual que las sociales.

## Código Relevante
```javascript
const signup = async (email, password, userData) => {
  await checkEmailExists(email); // Nuestra validación personalizada
  await createUserWithEmailAndPassword(auth, email, password);
  // Guardado en DB...
};

const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
```
