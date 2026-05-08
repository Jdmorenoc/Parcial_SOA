# Autenticación con GitHub

Especialmente útil para entornos de desarrollo o aplicaciones técnicas, permitiendo el uso de perfiles de GitHub.

## Implementación

1.  **OAuth App**: Se registró una aplicación OAuth en GitHub Settings para obtener las credenciales necesarias.
2.  **AuthContext**: Implementado mediante `GithubAuthProvider`.
3.  **Gestión de Datos**: 
    *   Extrae el nombre de usuario y el correo electrónico (si es público).
    *   Crea el registro en Firestore de manera consistente con los otros métodos sociales.
4.  **Validación de Duplicados**: Al igual que los otros métodos, verifica en Firestore si el correo electrónico ya está asociado a una cuenta de Email o Google para evitar la fragmentación de perfiles.

## Código Relevante
```javascript
const signInWithGithub = async () => {
  const userCredential = await signInWithPopup(auth, githubProvider);
  // Registro de sesión y usuario...
};
```
