import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPage.css';

export default function ResetPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [resetExitoso, setResetExitoso] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const navigate = useNavigate();

  // ✅ Obtener email del localStorage al montar el componente
  useEffect(() => {
    const email = localStorage.getItem('emailRecuperacion');
    if (!email) {
      setMensajeError('No hay solicitud de recuperación. Por favor, intenta nuevamente desde ¿Olvidaste tu contraseña?');
      setTimeout(() => navigate('/forgot'), 2000);
    } else {
      setEmailRecuperacion(email);
    }
  }, [navigate]);

  const validatePassword = (password) => {
    return (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula y un número';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // useEffect: muestra el toast, espera 2.5s y redirige
  useEffect(() => {
    if (!resetExitoso) return;

    setToastVisible(true);

    const timer = setTimeout(() => {
      setToastVisible(false);
      setResetExitoso(false);
      setFormData({ password: '', confirmPassword: '' });
      setErrors({});
      
      // ✅ Limpiar email de recuperación
      localStorage.removeItem('emailRecuperacion');
      
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [resetExitoso, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm() && emailRecuperacion) {
      // ✅ Obtener usuarios y actualizar contraseña
      const usuariosGuardados = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioIndex = usuariosGuardados.findIndex(
        u => u.email.toLowerCase() === emailRecuperacion.toLowerCase()
      );

      if (usuarioIndex !== -1) {
        // Actualizar contraseña del usuario
        usuariosGuardados[usuarioIndex].password = formData.password;
        
        // Guardar cambios en localStorage
        localStorage.setItem('usuarios', JSON.stringify(usuariosGuardados));

        console.log('✅ Contraseña actualizada para:', emailRecuperacion);
        console.log('Nueva contraseña:', formData.password);
        
        setResetExitoso(true);
      } else {
        setMensajeError('No se encontró la cuenta. Por favor intenta de nuevo.');
      }
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <h1>Restablecer Contraseña</h1>
          <p>Ingresa tu nueva contraseña</p>
          {emailRecuperacion && (
            <p style={{ fontSize: '12px', color: '#7A9AC7', marginTop: '8px' }}>
              Cuenta: {emailRecuperacion}
            </p>
          )}
        </div>

        {mensajeError ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#e74c3c',
            backgroundColor: '#fff5f5',
            borderRadius: '8px',
            border: '1px solid #e74c3c'
          }}>
            <p>{mensajeError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            <div className="form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nueva contraseña"
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Repite tu nueva contraseña"
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn-reset">
              Cambiar Contraseña
            </button>
          </form>
        )}

        <div className="reset-footer">
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
              <span className="toast-title">¡Contraseña cambiada!</span>
              <span className="toast-sub">Redirigiendo al inicio de sesión...</span>
            </div>
            <div className="toast-progress" />
          </div>
        </div>
      )}
    </div>
  );
}