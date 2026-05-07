import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, where, getDoc, doc, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import "./Home.css";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [userData, setUserData] = useState(null);
  
  // Estados para búsqueda
  const [searchEmail, setSearchEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // Estado para la subida de imagen
  const [isUploading, setIsUploading] = useState(false);

  // Establecer el usuario actual como objetivo inicial
  useEffect(() => {
    if (user && !targetUserId) {
      setTargetUserId(user.uid);
    }
  }, [user]);

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
    if (!targetUserId) return;

    // Query para obtener el historial del usuario objetivo (propio o buscado)
    const q = query(
      collection(db, "sessionHistory"),
      where("userId", "==", targetUserId),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessions = [];
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      setHistoryData(sessions);
      
      // Solo guardar en localStorage si es nuestro propio historial
      if (targetUserId === user?.uid) {
        localStorage.setItem(`historial_${user.uid}`, JSON.stringify(sessions));
      }
    });

    // Cargar datos guardados en localStorage solo para el usuario actual
    if (targetUserId === user?.uid) {
      const savedHistory = localStorage.getItem(`historial_${user.uid}`);
      if (savedHistory) {
        setHistoryData(JSON.parse(savedHistory));
      }
    }

    return () => unsubscribe();
  }, [targetUserId, user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    
    if (!searchEmail.trim()) {
      setTargetUserId(user.uid);
      setIsSearching(false);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", searchEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError("Usuario no encontrado");
        return;
      }

      const foundUser = querySnapshot.docs[0].data();
      setTargetUserId(foundUser.uid);
      setIsSearching(true);
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      setSearchError("Error al realizar la búsqueda");
    }
  };

  const clearSearch = () => {
    setSearchEmail("");
    setTargetUserId(user.uid);
    setIsSearching(false);
    setSearchError("");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Leer el archivo como Data URL (Base64)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = async () => {
          // 2. Comprimir la imagen usando Canvas (Firestore tiene límite de 1MB por documento)
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Obtener el string en formato Base64 comprimido (formato JPEG, calidad 70%)
          const base64Image = canvas.toDataURL("image/jpeg", 0.7);

          try {
            // NOTA: No podemos usar updateProfile de Auth con Base64 porque tiene un límite de caracteres estricto.
            // Por lo tanto, solo la guardamos en Firestore, que es donde realmente la necesitamos.
            
            // Guardar en Firestore
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { photoURL: base64Image }, { merge: true });

            // Actualizar estado y caché
            const updatedData = { ...userData, photoURL: base64Image };
            setUserData(updatedData);
            localStorage.setItem(`userData_${user.uid}`, JSON.stringify(updatedData));
            
            alert("¡Foto de perfil actualizada con éxito!");
          } catch (error) {
            console.error("Error guardando imagen en base de datos:", error);
            alert("Error al guardar la imagen: " + error.message);
          } finally {
            setIsUploading(false);
            e.target.value = null; // Limpiar input
          }
        };
      };
      
      reader.onerror = (error) => {
        console.error("Error leyendo el archivo:", error);
        setIsUploading(false);
      };
      
    } catch (error) {
      console.error("Error en proceso de imagen:", error);
      setIsUploading(false);
    }
  };

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
            <div 
              className={`profile-photo-container ${isUploading ? 'uploading' : ''}`} 
              onClick={() => !isUploading && document.getElementById('fileInput').click()}
              title={isUploading ? "Subiendo..." : "Click para cambiar foto"}
            >
              {isUploading ? (
                <div className="profile-placeholder uploading-placeholder">
                  <span className="spinner">⏳</span>
                </div>
              ) : userData?.photoURL || user?.photoURL ? (
                <img src={userData?.photoURL || user?.photoURL} alt="Perfil" className="profile-photo" />
              ) : (
                <div className="profile-placeholder">
                  {userData?.nombre?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              )}
              <input 
                type="file" 
                id="fileInput" 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleImageChange} 
              />
            </div>
            <h3>¡Bienvenido!</h3>
            {(userData || user?.displayName) && (
              <h2 className="user-name-display">
                {user?.displayName || (userData ? `${userData.nombre || ""} ${userData.apellidos || ""}`.trim() : "")}
              </h2>
            )}
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
          <div className="history-header-actions">
            <h2>{isSearching ? `Sesiones de: ${searchEmail}` : "Mi Historial de Sesiones"}</h2>
            
            <form onSubmit={handleSearch} className="search-box">
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Buscar por correo..." 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="btn-search" title="Buscar usuario">
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
              {isSearching && (
                <button type="button" onClick={clearSearch} className="btn-clear">
                  Ver mis sesiones
                </button>
              )}
            </form>
          </div>
          
          {searchError && <p className="search-error-msg">{searchError}</p>}
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
