import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import SessionHistory from "../../components/SessionHistory/SessionHistory";
import Clientes from "../../components/Clientes/Clientes";
import "./Home.css";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("historial");
  const menuRef = useRef(null);

  // Get user data from Firestore
  useEffect(() => {
    if (!user) return;

    const getUserData = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);
        localStorage.setItem(`userData_${user.uid}`, JSON.stringify(data));
      }
    };

    const savedUserData = localStorage.getItem(`userData_${user.uid}`);
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }

    getUserData();
  }, [user]);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = async () => {
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

          const base64Image = canvas.toDataURL("image/jpeg", 0.7);

          try {
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { photoURL: base64Image }, { merge: true });

            const updatedData = { ...userData, photoURL: base64Image };
            setUserData(updatedData);
            localStorage.setItem(`userData_${user.uid}`, JSON.stringify(updatedData));
          } catch (error) {
            console.error("Error guardando imagen en base de datos:", error);
            alert("Error al guardar la imagen: " + error.message);
          } finally {
            setIsUploading(false);
            e.target.value = null;
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

  const displayName = user?.displayName || (userData ? `${userData.nombre || ""} ${userData.apellidos || ""}`.trim() : "");
  const userEmail = user?.email || userData?.email || "";
  const userInitial = userData?.nombre?.charAt(0) || user?.email?.charAt(0) || "U";
  const photoURL = userData?.photoURL || user?.photoURL;

  return (
    <div className="home-layout">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className={`home-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-brand">
          <div 
            className="brand-icon" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ cursor: "pointer" }}
            title={sidebarCollapsed ? "Expandir" : ""}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          {!sidebarCollapsed && (
            <>
              <span className="brand-name">SessionApp</span>
              <button 
                className="sidebar-toggle" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
                title="Colapsar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{!sidebarCollapsed && "MENÚ"}</div>
          <a 
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveView("dashboard"); }}
            title="Dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </a>
          <a 
            className={`nav-item ${activeView === "historial" ? "active" : ""}`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveView("historial"); }}
            title="Historial"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {!sidebarCollapsed && <span>Historial</span>}
          </a>
          <a 
            className={`nav-item ${activeView === "clientes" ? "active" : ""}`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveView("clientes"); }}
            title="Clientes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {!sidebarCollapsed && <span>Clientes</span>}
          </a>
        </nav>

        {/* Sidebar User Card */}
        {!sidebarCollapsed && (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {photoURL ? (
                <img src={photoURL} alt="Perfil" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName || "Usuario"}</span>
              <span className="sidebar-user-role">Miembro</span>
            </div>
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="home-main">
        {/* ===== TOP HEADER ===== */}
        <header className="home-header">
          <div className="header-left">
            <h1 className="header-greeting">
              ¡Bienvenido{displayName ? `, ${displayName.split(" ")[0]}` : ""}! 
            </h1>
            <p className="header-subtitle">
              {activeView === "historial" && "Aquí puedes ver y gestionar tu historial de sesiones"}
              {activeView === "clientes" && "Aquí puedes ver y estructurar la información de tus clientes"}
              {activeView === "dashboard" && "Resumen analítico y estadísticas de la aplicación"}
            </p>
          </div>

          <div className="header-right">
            {/* Profile Button */}
            <div className="profile-dropdown" ref={menuRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                id="profile-menu-trigger"
              >
                <div className={`header-avatar ${isUploading ? "uploading" : ""}`}>
                  {isUploading ? (
                    <div className="avatar-spinner"></div>
                  ) : photoURL ? (
                    <img src={photoURL} alt="Perfil" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="profile-trigger-info">
                  <span className="profile-trigger-name">{displayName || "Usuario"}</span>
                  <span className="profile-trigger-email">{userEmail}</span>
                </div>
                <svg className={`profile-chevron ${profileMenuOpen ? "open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="profile-menu" id="profile-dropdown-menu">
                  <div className="profile-menu-header">
                    <div className="pm-avatar">
                      {photoURL ? (
                        <img src={photoURL} alt="Perfil" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div className="pm-info">
                      <span className="pm-name">{displayName || "Usuario"}</span>
                      <span className="pm-email">{userEmail}</span>
                    </div>
                  </div>

                  <div className="profile-menu-divider"></div>

                  <button className="profile-menu-item" onClick={() => { document.getElementById('fileInput').click(); setProfileMenuOpen(false); }} id="change-photo-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    Cambiar foto de perfil
                  </button>

                  <button className="profile-menu-item" id="settings-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Configuración
                  </button>

                  <div className="profile-menu-divider"></div>

                  <button className="profile-menu-item logout" onClick={handleLogout} id="logout-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </header>

        {/* ===== CONTENT AREA ===== */}
        <main className="home-content">
          {activeView === "historial" && <SessionHistory />}
          {activeView === "clientes" && <Clientes />}
          {activeView === "dashboard" && (
            <div style={{ padding: "32px", color: "#2E5C8A", textAlign: "left" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Dashboard</h2>
              <p style={{ color: "#7A9AC7", fontSize: "0.9rem" }}>Próximamente disponible. Selecciona **Historial** o **Clientes** en el menú izquierdo.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Home;
