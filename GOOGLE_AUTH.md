# Autenticación con Google

La autenticación con Google permite a los usuarios acceder a la aplicación utilizando sus cuentas de Google existentes, lo que simplifica el proceso de registro y mejora la conversión.

## Implementación

1.  **Firebase Config**: Se habilitó el proveedor de Google en la consola de Firebase.
2.  **AuthContext**: Se utiliza el método `signInWithPopup` de Firebase Auth con un `GoogleAuthProvider`.
3.  **Flujo de Registro**:
    *   Si es la primera vez que el usuario ingresa con Google, se crea un documento en la colección `users` de Firestore con su información básica (nombre, email, foto).
    *   Si el correo ya está registrado con otro método (ej: Email/Password), el sistema detecta el conflicto y lanza un error amigable pidiendo usar el método original.
4.  **Sesiones**: Al iniciar sesión exitosamente, se registra una entrada en `sessionHistory` marcada con el proveedor "google".

## Código Relevante
```javascript
const signInWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  // Validación de duplicados y guardado en Firestore...
};
```
