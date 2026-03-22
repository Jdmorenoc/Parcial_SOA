import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const navigate = useNavigate();

  // Validar formato de email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    } else {
      // Verificar si el correo está registrado
      const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioEncontrado = usuariosGuardados.find(
        u => u.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (!usuarioEncontrado) {
        newErrors.email = 'Este correo no está registrado. Crea una cuenta primero';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Obtener usuarios guardados
      const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioEncontrado = usuariosGuardados.find(
        u => u.email.toLowerCase() === formData.email.toLowerCase()
      );

      // Validar que el usuario existe y la contraseña es correcta
      if (usuarioEncontrado && usuarioEncontrado.password === formData.password) {
        // Login exitoso
        console.log('Login exitoso:', usuarioEncontrado);
        localStorage.setItem('usuarioActivo', JSON.stringify({
          nombre: usuarioEncontrado.nombre,
          apellidos: usuarioEncontrado.apellidos,
          email: usuarioEncontrado.email
        }));

        setMensajeExito(`Sesión iniciada correctamente. ¡Bienvenido ${usuarioEncontrado.nombre}!`);
        setLoginExitoso(true);

        // Limpiar el formulario
        setFormData({
          email: '',
          password: ''
        });

        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          setLoginExitoso(false);
          setMensajeExito('');
        }, 3000);
      } else if (usuarioEncontrado) {
        // Usuario encontrado pero contraseña incorrecta
        setErrors({
          ...errors,
          password: 'La contraseña es incorrecta'
        });
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Iniciar Sesión</h1>
          <p>Bienvenido de vuelta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo de Email */}
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ejemplo@correo.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Campo de Contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Ingresa tu contraseña"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Botón de Envío */}
          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>
        </form>

        {/* Enlaces de Navegación */}
        <div className="login-links">
          <a
            onClick={() => navigate('/forgot')}
            className="link-forgot"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Sección de Registro */}
        <div className="login-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <a
              onClick={() => navigate('/register')}
              className="link-register"
            >
              Crea una aquí
            </a>
          </p>
        </div>
      </div>

      {/* Toast de éxito */}
      {loginExitoso && (
        <div className="toast-container">
          <div className="toast">
            <div className="toast-icon">✓</div>
            <div className="toast-text">
              <span className="toast-title">¡Login exitoso!</span>
              <span className="toast-sub">{mensajeExito}</span>
            </div>
            <div className="toast-progress" />
          </div>
        </div>
      )}
    </div>
  );
}
