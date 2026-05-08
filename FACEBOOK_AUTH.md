# Autenticación con Facebook

Permite el inicio de sesión rápido mediante la integración con Facebook SDK a través de Firebase.

## Implementación

1.  **Configuración**: Requiere un ID de aplicación y un Secreto de aplicación configurados en el portal de Facebook Developers y vinculados en Firebase.
2.  **Manejo de Imágenes**: Se implementó una lógica especial para añadir el `access_token` a la URL de la foto de perfil de Facebook, permitiendo visualizar imágenes de alta calidad.
3.  **Seguridad de Cuentas**:
    *   Valida si el email ya existe en el sistema.
    *   Si hay conflicto de proveedores (ej: el usuario ya tiene cuenta con Google), Firebase Auth arroja un error que el sistema traduce para informar al usuario.
4.  **Firestore**: Los metadatos del usuario se sincronizan en la colección `users`, marcando el origen como `registroConFacebook: true`.

## Código Relevante
```javascript
const signInWithFacebook = async () => {
  const userCredential = await signInWithPopup(auth, facebookProvider);
  // Extracción de foto HD y validación...
};
```
