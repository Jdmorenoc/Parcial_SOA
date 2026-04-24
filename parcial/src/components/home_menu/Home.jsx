import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        {/* Header con botón de logout */}
        <div className="home-header">
          <div className="home-header-content">
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="welcome-message">
          <h3>¡Bienvenido!</h3>
          <p>Tu sesión ha iniciado correctamente</p>
        </div>

        {/* Sección de información de usuario */}
        <div className="home-section">
          <h2>Información de Usuario</h2>
          <div className="user-info-card">
            <p>
              <span>Email:</span>
              {user?.email}
            </p>
            <p>
              <span>ID:</span>
              {user?.uid}
            </p>
          </div>
        </div>

        {/* Acciones disponibles */}
        <div className="home-section">
          <h2>Opciones</h2>
          <div className="home-actions">
            <button className="btn-action">Ver Perfil</button>
            <button className="btn-action">Configuración</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
