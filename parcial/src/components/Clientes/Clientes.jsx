import { useState } from "react";
import { MOCK_CLIENTES } from "../../services/clientesService";
import "./Clientes.css";

function Clientes() {
  const [activeTab, setActiveTab] = useState("lista"); // 'lista' | 'esquema'
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Definición formal de la estructura de clientes para mostrar en la pestaña 'esquema'
  const schemaDefinition = [
    { name: "id", type: "string", required: "Sí (Autogenerado)", desc: "Identificador único del cliente asignado automáticamente por Firestore." },
    { name: "tipoDocumento", type: "string", required: "Sí", desc: "Tipo de documento legal. Valores recomendados: CC, CE, NIT, PP." },
    { name: "documento", type: "string", required: "Sí", desc: "Número único de documento de identidad (clave de negocio, no duplicable)." },
    { name: "nombres", type: "string", required: "Sí", desc: "Nombre(s) del cliente o razón social principal." },
    { name: "apellidos", type: "string", required: "Sí", desc: "Apellido(s) del cliente o siglas comerciales (ej. S.A.S.)." },
    { name: "email", type: "string", required: "Sí", desc: "Correo electrónico principal de contacto. Debe cumplir con formato estándar." },
    { name: "telefono", type: "string", required: "No", desc: "Número de teléfono fijo o móvil. Formato libre." },
    { name: "direccion", type: "string", required: "No", desc: "Dirección física de residencia o domicilio fiscal." },
    { name: "estado", type: "string", required: "Sí", desc: "Estado operativo de la relación comercial. Valores: 'Activo' | 'Inactivo'." },
    { name: "creadoPor", type: "string", required: "Sí", desc: "ID único (uid) del usuario administrador que creó el registro del cliente." },
    { name: "fechaCreacion", type: "timestamp / date", required: "Sí", desc: "Marca de tiempo del servidor al momento del registro." },
  ];

  // Filtros aplicados sobre los datos mock
  const filteredClientes = MOCK_CLIENTES.filter((c) => {
    const matchesSearch =
      c.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documento.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesEstado = 
      filterEstado === "todos" || 
      c.estado.toLowerCase() === filterEstado.toLowerCase();

    return matchesSearch && matchesEstado;
  });

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="clientes-container">
      {/* ===== HEADER SECTOR ===== */}
      <div className="cli-header">
        <div className="cli-header-title">
          <div className="cli-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <h2 className="cli-title">Estructura y Gestión de Clientes</h2>
            <p className="cli-subtitle">Diseño, definición de esquema de datos y visualización de registros</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="cli-tabs">
          <button 
            className={`cli-tab-btn ${activeTab === "lista" ? "active" : ""}`}
            onClick={() => setActiveTab("lista")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Vista de Registros
          </button>
          <button 
            className={`cli-tab-btn ${activeTab === "esquema" ? "active" : ""}`}
            onClick={() => setActiveTab("esquema")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            Esquema del Modelo
          </button>
        </div>
      </div>

      {/* ===== CONTENT SECTOR ===== */}
      <div className="cli-content-wrapper">
        {activeTab === "lista" ? (
          <div className="cli-tab-content">
            {/* Filters Bar */}
            <div className="cli-filters-bar">
              <div className="cli-search-box">
                <svg className="cli-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, correo o documento..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cli-search-input"
                />
              </div>

              <div className="cli-status-select-wrapper">
                <label>Estado:</label>
                <select 
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="cli-status-select"
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
              
              <div className="cli-crud-alert">
                <span className="cli-badge-info">Estructura Activa</span>
                <span className="cli-text-muted">Fase 1: Estructuración y Mockups</span>
              </div>
            </div>

            {/* Clientes Table */}
            <div className="cli-table-container">
              {filteredClientes.length > 0 ? (
                <table className="cli-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Cliente / Nombre Completo</th>
                      <th>Contacto</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th>Registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cliente) => (
                      <tr key={cliente.id} className={`cli-row ${cliente.estado.toLowerCase()}`}>
                        <td className="cli-cell-doc">
                          <span className="cli-doc-badge">{cliente.tipoDocumento}</span>
                          <span className="cli-doc-num">{cliente.documento}</span>
                        </td>
                        <td className="cli-cell-name">
                          <div className="cli-user-avatar">
                            {cliente.nombres.charAt(0)}
                          </div>
                          <div className="cli-name-group">
                            <span className="cli-name">{`${cliente.nombres} ${cliente.apellidos}`}</span>
                            <span className="cli-id-info">ID: {cliente.id}</span>
                          </div>
                        </td>
                        <td className="cli-cell-contact">
                          <div className="cli-contact-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            {cliente.email}
                          </div>
                          {cliente.telefono && (
                            <div className="cli-contact-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                              {cliente.telefono}
                            </div>
                          )}
                        </td>
                        <td className="cli-cell-address">{cliente.direccion || "—"}</td>
                        <td>
                          <span className={`cli-status-badge ${cliente.estado.toLowerCase()}`}>
                            <span className="cli-status-dot"></span>
                            {cliente.estado}
                          </span>
                        </td>
                        <td className="cli-cell-date">{formatDate(cliente.fechaCreacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="cli-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <h3>Sin Resultados</h3>
                  <p>No se encontraron clientes que coincidan con la búsqueda o filtros aplicados.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="cli-tab-content">
            {/* Schema Documentation Panel */}
            <div className="cli-schema-panel">
              <div className="cli-schema-info-card">
                <h3>Definición de Atributos — Colección de Firestore</h3>
                <p>El siguiente listado define cada uno de los campos estructurales implementados en el modelo de clientes. Esta estructura garantiza coherencia de datos, integridad comercial y trazabilidad de los administradores creadores.</p>
                
                <div className="cli-schema-meta">
                  <div className="cli-meta-item">
                    <strong>Nombre de la Colección:</strong>
                    <code>clientes</code>
                  </div>
                  <div className="cli-meta-item">
                    <strong>Proveedor de BD:</strong>
                    <span>Firebase Firestore (NoSQL Document Database)</span>
                  </div>
                </div>
              </div>

              <div className="cli-schema-grid">
                {schemaDefinition.map((field) => (
                  <div className="cli-schema-card" key={field.name}>
                    <div className="cli-schema-card-header">
                      <h4 className="cli-field-name">{field.name}</h4>
                      <span className={`cli-field-req ${field.required.includes("No") ? "optional" : "required"}`}>
                        {field.required}
                      </span>
                    </div>
                    <div className="cli-schema-card-body">
                      <div className="cli-field-type">
                        <strong>Tipo de dato:</strong>
                        <code>{field.type}</code>
                      </div>
                      <p className="cli-field-desc">{field.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Clientes;
