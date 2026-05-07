import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, where, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import "./Home.css";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [userData, setUserData] = useState(null);

  // Obtener datos del usuario de Firestore
  useEffect(() => {
    if (!user) return;

    const getUserData = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);
        // Guardar en localStorage para persistencia
        localStorage.setItem(`userData_${user.uid}`, JSON.stringify(data));
      }
    };

    // Primero cargar desde localStorage si existe
    const savedUserData = localStorage.getItem(`userData_${user.uid}`);
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }

    // Luego obtener datos frescos de Firebase
    getUserData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Query para obtener solo el historial del usuario actual
    const q = query(
      collection(db, "sessionHistory"),
      where("userId", "==", user.uid),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessions = [];
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      setHistoryData(sessions);
      // Guardar en localStorage para persistencia
      localStorage.setItem(`historial_${user.uid}`, JSON.stringify(sessions));
    });

    // Cargar datos guardados en localStorage mientras se obtienen de Firebase
    const savedHistory = localStorage.getItem(`historial_${user.uid}`);
    if (savedHistory) {
      setHistoryData(JSON.parse(savedHistory));
    }

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      // Limpiar localStorage al cerrar sesión
      if (user) {
        localStorage.removeItem(`historial_${user.uid}`);
        localStorage.removeItem(`userData_${user.uid}`);
      }
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };
{userData && (
              <h2 className="user-name-display">
                {userData.nombre} {userData.apellidos}
              </h2>
            )}
            
  const formatDate = (timestamp) => {
    if (!timestamp) return "Sesión activa";
    return new Date(timestamp.seconds * 1000).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="home-container">
      <div className="home-wrapper">
        {/* Panel Izquierdo - Bienvenida */}
        <div className="panel-welcome">
          <div className="welcome-header">
            <h3>¡Bienvenido!</h3>
            <p>Tu sesión ha iniciado correctamente.</p>
          </div>
          <div className="welcome-actions">
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Panel Derecho - Historial */}
        <div className="panel-history">
          <h2>Mi Historial de Sesiones</h2>
          <div className="history-list">
            {historyData.length > 0 ? (
              historyData.map((item) => (
                <div key={item.id} className={`history-card ${item.status.toLowerCase()}`}>
                  <div className="history-card-header">
                    <span className="user-name">{`${item.nombre} ${item.apellidos}`}</span>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="history-card-body">
                    <p>
                      <strong>Inicio:</strong> {formatDate(item.startTime)}
                    </p>
                    <p>
                      <strong>Fin:</strong> {formatDate(item.endTime)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-history">No hay sesiones registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
