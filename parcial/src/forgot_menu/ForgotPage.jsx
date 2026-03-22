import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPage.css';

export default function ForgotPage() {
  const [formData, setFormData] = useState({ email: '' });
  const [errors, setErrors] = useState({});
  const [forgotExitoso, setForgotExitoso] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    // ✅ Buscar en localStorage.usuarios (actualizado)
    const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const usuarioEncontrado = usuariosGuardados.find(
      u => u.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (!usuarioEncontrado) {
      setErrors({ email: 'El correo no está registrado' });
      return false;
    }

    setErrors({});
    return true;
  };

  // useEffect: muestra el toast, espera 2.5s y redirige
  useEffect(() => {
    if (!forgotExitoso) return;

    setToastVisible(true);

    const timer = setTimeout(() => {
      setToastVisible(false);
      setForgotExitoso(false);
      
      // ✅ Guardar email temporalmente para ResetPage
      localStorage.setItem('emailRecuperacion', formData.email.toLowerCase());
      
      setFormData({ email: '' });
      setErrors({});
      navigate('/reset');
    }, 2500);

    return () => clearTimeout(timer);
  }, [forgotExitoso, navigate, formData.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Enlace de recuperación enviado a:', formData.email);
      setForgotExitoso(true);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-header">
          <h1>Recuperar Contraseña</h1>
          <p>Ingresa tu correo electrónico para recibir instrucciones</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-form">
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
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <button type="submit" className="btn-forgot">
            Enviar Instrucciones
          </button>
        </form>

        <div className="forgot-footer">
          <p>
            ¿Recordaste tu contraseña?{' '}
            <a onClick={() => navigate('/login')} className="link-login">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>

      {/* Toast de éxito */}
      {toastVisible && (
        <div className="toast-container">
          <div className="toast">
            <div className="toast-icon">✓</div>
            <div className="toast-text">
              <span className="toast-title">¡Enlace enviado!</span>
              <span className="toast-sub">Redirigiendo a restablecer contraseña...</span>
            </div>
            <div className="toast-progress" />
          </div>
        </div>
      )}
    </div>
  );
}