import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  subscribeVentas, 
  addVenta, 
  updateVenta, 
  deleteVenta 
} from "../../services/ventasService";
import { subscribeClientes } from "../../services/clientesService";
import "./Ventas.css";

function Ventas({ currentUserDisplayName }) {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("lista"); // 'lista' | 'esquema'
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Estados de los Modales
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [currentVentaId, setCurrentVentaId] = useState(null);
  
  // Estado de Confirmación de Eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState(null);

  // Estados del Formulario
  const initialFormState = {
    clienteId: "",
    producto: "",
    cantidad: 1,
    precioUnitario: 0,
    metodoPago: "Efectivo",
    estado: "Completada"
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Estados de Notificación / Toast Alerts
  const [toastAlert, setToastAlert] = useState(null);

  // Definición del esquema para visualización
  const schemaDefinition = [
    { name: "id", type: "string", required: "Sí (Autogenerado)", desc: "Identificador único de la venta asignado automáticamente por Firestore." },
    { name: "clienteId", type: "string", required: "Sí", desc: "ID del documento del cliente asociado en la colección 'clientes'." },
    { name: "clienteNombre", type: "string", required: "Sí", desc: "Nombre completo del cliente al momento de registrar la venta (para acceso rápido)." },
    { name: "producto", type: "string", required: "Sí", desc: "Nombre o descripción del producto o servicio vendido." },
    { name: "cantidad", type: "number", required: "Sí", desc: "Cantidad de artículos vendidos. Debe ser un entero positivo." },
    { name: "precioUnitario", type: "number", required: "Sí", desc: "Precio unitario del producto o servicio. Debe ser mayor a 0." },
    { name: "total", type: "number", required: "Sí", desc: "Total de la transacción. Calculado automáticamente (cantidad * precioUnitario)." },
    { name: "metodoPago", type: "string", required: "Sí", desc: "Forma de pago de la venta. Valores: 'Efectivo' | 'Tarjeta' | 'Transferencia'." },
    { name: "estado", type: "string", required: "Sí", desc: "Estado de la transacción. Valores: 'Completada' | 'Pendiente' | 'Cancelada'." },
    { name: "creadoPor", type: "string", required: "Sí", desc: "ID único (uid) del usuario administrador que registró la venta." },
    { name: "registradoPor", type: "string", required: "Sí", desc: "Nombre completo o email del administrador que registró la venta." },
    { name: "fechaCreacion", type: "timestamp / date", required: "Sí", desc: "Marca de tiempo del servidor al momento del registro." },
  ];

  // Resolver el nombre del usuario de forma robusta (prop, auth o localStorage)
  const savedUserData = localStorage.getItem(`userData_${user?.uid}`);
  const userData = savedUserData ? JSON.parse(savedUserData) : null;
  const resolvedDisplayName = currentUserDisplayName || user?.displayName || (userData ? `${userData.nombre || ""} ${userData.apellidos || ""}`.trim() : "") || "Usuario";

  // Suscripción a los clientes en tiempo real para el selector
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeClientes(
      user.uid,
      (updatedClientes) => {
        // Filtrar clientes para mostrar solo los Activos
        const activeClientes = updatedClientes.filter(c => c.estado === "Activo");
        setClientes(activeClientes);
      },
      (error) => {
        console.error("Error al obtener clientes para el selector de ventas:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Suscripción en tiempo real a las ventas de Firestore para el usuario activo
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    const unsubscribe = subscribeVentas(
      user.uid, 
      (updatedVentas) => {
        setVentas(updatedVentas);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al obtener ventas de Firestore:", error);
        setIsLoading(false);
        triggerToast("error", "Error de conexión con la base de datos: " + error.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Manejo de Alertas Temporales
  const triggerToast = (type, message) => {
    setToastAlert({ type, message });
    setTimeout(() => {
      setToastAlert(null);
    }, 4000);
  };

  // Filtros aplicados sobre los datos en tiempo real
  const filteredVentas = ventas.filter((v) => {
    const matchesSearch =
      (v.producto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.clienteNombre || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesEstado = 
      filterEstado === "todos" || 
      (v.estado || "").toLowerCase() === filterEstado.toLowerCase();

    return matchesSearch && matchesEstado;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  const exportToPDF = async () => {
    try {
      let jsPDFClass = window.jspdf?.jsPDF;
      if (!jsPDFClass) {
        triggerToast("info", "Cargando componentes de exportación...");
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          script.onload = () => {
            const autoTableScript = document.createElement("script");
            autoTableScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.6.0/jspdf.plugin.autotable.min.js";
            autoTableScript.onload = () => {
              resolve();
            };
            autoTableScript.onerror = () => reject(new Error("Error al cargar la tabla del PDF"));
            document.body.appendChild(autoTableScript);
          };
          script.onerror = () => reject(new Error("Error al cargar la librería PDF"));
          document.body.appendChild(script);
        });
        jsPDFClass = window.jspdf?.jsPDF;
      }

      if (!jsPDFClass) {
        throw new Error("No se pudo iniciar la librería de PDF");
      }

      const doc = new jsPDFClass("landscape");
      
      // Título y detalles
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(125, 60, 152); // #7D3C98
      doc.text("SessionApp — Registro de Ventas", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha de generación: ${new Date().toLocaleString("es-CO")}`, 14, 28);
      
      let filterText = "Todas";
      if (searchTerm) {
        filterText = `Búsqueda: "${searchTerm}"`;
      }
      const estadoText = filterEstado === "todos" ? "Todos" : filterEstado.toUpperCase();
      doc.text(`Filtros: ${filterText} | Estado: ${estadoText} | Total: ${filteredVentas.length} registros`, 14, 34);
      
      // Dibujar una línea decorativa
      doc.setDrawColor(235, 222, 240); // #EBDEF0
      doc.setLineWidth(0.5);
      doc.line(14, 38, 282, 38);

      const tableColumns = [
        "Cliente",
        "Producto / Concepto",
        "Cant.",
        "Precio Unitario",
        "Total",
        "Método de Pago",
        "Estado",
        "Registrado por",
        "Fecha"
      ];
      
      const tableRows = filteredVentas.map((v) => [
        v.clienteNombre || "—",
        v.producto || "",
        v.cantidad || 0,
        formatCurrency(v.precioUnitario || 0),
        formatCurrency(v.total || 0),
        v.metodoPago || "",
        v.estado || "",
        v.registradoPor || resolvedDisplayName,
        formatDate(v.fechaCreacion)
      ]);

      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 42,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 3, font: "helvetica" },
        headStyles: { fillColor: [125, 60, 152], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [251, 249, 252] },
      });

      doc.save(`ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      triggerToast("error", error.message || "Hubo un error al generar el PDF.");
    }
  };

  // CRUD Event Handlers
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Formatear precioUnitario con separadores de miles
    if (name === "precioUnitario") {
      const numericValue = value.replace(/\D/g, "");
      value = numericValue ? new Intl.NumberFormat("es-CO").format(numericValue) : "";
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al editar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.clienteId) errors.clienteId = "Debe seleccionar un cliente";
    if (!formData.producto.trim()) errors.producto = "El producto/concepto es requerido";
    if (!formData.cantidad || Number(formData.cantidad) <= 0) {
      errors.cantidad = "La cantidad debe ser mayor a 0";
    }
    const precioNumerico = Number(String(formData.precioUnitario).replace(/\D/g, ""));
    if (formData.precioUnitario === undefined || formData.precioUnitario === "" || precioNumerico < 0) {
      errors.precioUnitario = "El precio unitario debe ser igual o mayor a 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    if (clientes.length === 0) {
      triggerToast("error", "No puedes registrar ventas sin clientes activos. Registra un cliente primero.");
      return;
    }
    setFormData({
      ...initialFormState,
      clienteId: clientes[0]?.id || ""
    });
    setFormErrors({});
    setModalMode("create");
    setCurrentVentaId(null);
    setShowModal(true);
  };

  const openEditModal = (venta) => {
    setFormData({
      clienteId: venta.clienteId || "",
      producto: venta.producto || "",
      cantidad: venta.cantidad || 1,
      precioUnitario: venta.precioUnitario ? new Intl.NumberFormat("es-CO").format(venta.precioUnitario) : "",
      metodoPago: venta.metodoPago || "Efectivo",
      estado: venta.estado || "Completada"
    });
    setFormErrors({});
    setModalMode("edit");
    setCurrentVentaId(venta.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Obtener el nombre del cliente desde el listado local
      const selectedClientObj = clientes.find(c => c.id === formData.clienteId);
      const clienteNombre = selectedClientObj 
        ? `${selectedClientObj.nombres} ${selectedClientObj.apellidos}`.trim()
        : "Cliente Desconocido";

      const dataToSave = {
        ...formData,
        clienteNombre,
        precioUnitario: Number(String(formData.precioUnitario).replace(/\D/g, "")),
        cantidad: Number(formData.cantidad),
        total: totalCalculado
      };

      if (modalMode === "create") {
        await addVenta(dataToSave, user.uid, resolvedDisplayName);
        triggerToast("success", "¡Venta registrada correctamente!");
      } else {
        await updateVenta(currentVentaId, dataToSave);
        triggerToast("success", "¡Registro de venta actualizado correctamente!");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar venta:", error);
      triggerToast("error", error.message || "Error al procesar la solicitud en Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  const askDeleteConfirmation = (venta) => {
    setVentaToDelete(venta);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!ventaToDelete) return;

    try {
      await deleteVenta(ventaToDelete.id);
      triggerToast("success", "¡Registro de venta eliminado correctamente!");
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      triggerToast("error", "No se pudo eliminar el registro de venta.");
    } finally {
      setShowDeleteConfirm(false);
      setVentaToDelete(null);
    }
  };

  const totalCalculado = Number(formData.cantidad || 0) * Number(String(formData.precioUnitario || "0").replace(/\D/g, ""));

  return (
    <div className="ventas-container">
      {/* ===== HEADER SECTOR ===== */}
      <div className="ven-header">
        <div className="ven-header-title">
          <div className="ven-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <h2 className="ven-title">Gestión de Ventas</h2>
            <p className="ven-subtitle">Registro y control de transacciones comerciales de tus clientes</p>
          </div>
        </div>

        {/* Tab Selector & Add Button */}
        <div className="ven-header-actions">
          <div className="ven-tabs">
            <button 
              className={`ven-tab-btn ${activeTab === "lista" ? "active" : ""}`}
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
              Ventas
            </button>
            <button 
              className={`ven-tab-btn ${activeTab === "esquema" ? "active" : ""}`}
              onClick={() => setActiveTab("esquema")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Estructura
            </button>
          </div>

          {activeTab === "lista" && (
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="ven-export-pdf-btn" 
                onClick={exportToPDF} 
                title="Exportar a PDF"
                disabled={filteredVentas.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Exportar PDF
              </button>
              <button className="ven-add-btn" onClick={openCreateModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nueva Venta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== CONTENT SECTOR ===== */}
      <div className="ven-content-wrapper">
        {activeTab === "lista" ? (
          <div className="ven-tab-content">
            {/* Filters Bar */}
            <div className="ven-filters-bar">
              <div className="ven-search-box">
                <svg className="ven-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar por cliente o producto..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ven-search-input"
                />
              </div>

              <div className="ven-status-select-wrapper">
                <label>Estado:</label>
                <select 
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="ven-status-select"
                >
                  <option value="todos">Todos</option>
                  <option value="completada">Completada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              
              <div className="ven-crud-alert">
                <span className="ven-badge-info">En línea</span>
                <span className="ven-text-success">Firestore Sincronizado</span>
              </div>
            </div>

            {/* Ventas Table or Loading State */}
            <div className="ven-table-container">
              {isLoading ? (
                <div className="ven-loading-overlay">
                  <div className="ven-loading-spinner"></div>
                  <p>Conectando con base de datos de ventas...</p>
                </div>
              ) : filteredVentas.length > 0 ? (
                <table className="ven-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Producto / Concepto</th>
                      <th>Cant.</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                      <th>Pago</th>
                      <th>Estado</th>
                      <th>Registrado por</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVentas.map((venta) => (
                      <tr key={venta.id} className="ven-row">
                        <td className="ven-text-bold">{venta.clienteNombre || "—"}</td>
                        <td>{venta.producto}</td>
                        <td>{venta.cantidad}</td>
                        <td>{formatCurrency(venta.precioUnitario)}</td>
                        <td className="ven-total-bold">{formatCurrency(venta.total)}</td>
                        <td>
                          <span className="ven-doc-badge">{venta.metodoPago}</span>
                        </td>
                        <td>
                          <span className={`ven-status-badge ${venta.estado.toLowerCase()}`}>
                            <span className="ven-status-dot"></span>
                            {venta.estado}
                          </span>
                        </td>
                        <td className="ven-text-bold" style={{ fontSize: "0.75rem" }}>
                          {venta.registradoPor || resolvedDisplayName}
                        </td>
                        <td className="ven-cell-date">{formatDate(venta.fechaCreacion)}</td>
                        <td>
                          <div className="ven-actions-cell">
                            <button 
                              className="ven-action-btn edit" 
                              onClick={() => openEditModal(venta)}
                              title="Editar"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button 
                              className="ven-action-btn delete" 
                              onClick={() => askDeleteConfirmation(venta)}
                              title="Eliminar"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="ven-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <h3>No hay ventas registradas</h3>
                  <p>Inicia registrando tu primera venta en la base de datos de Firestore.</p>
                  <button className="ven-add-btn" onClick={openCreateModal}>
                    Registrar Venta
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ven-tab-content">
            {/* Schema Documentation Panel */}
            <div className="ven-schema-panel">
              <div className="ven-schema-info-card">
                <h3>Definición de Atributos — Colección de Ventas</h3>
                <p>El siguiente listado define cada uno de los campos estructurales implementados en el modelo de ventas en Firestore. Garantiza coherencia financiera, integridad transaccional y total trazabilidad de las operaciones registradas por los administradores.</p>
                
                <div className="ven-schema-meta">
                  <div className="ven-meta-item">
                    <strong>Nombre de la Colección:</strong>
                    <code>ventas</code>
                  </div>
                  <div className="ven-meta-item">
                    <strong>Proveedor de BD:</strong>
                    <span>Firebase Firestore (NoSQL Document Database)</span>
                  </div>
                </div>
              </div>

              <div className="ven-schema-grid">
                {schemaDefinition.map((field) => (
                  <div className="ven-schema-card" key={field.name}>
                    <div className="ven-schema-card-header">
                      <h4 className="ven-field-name">{field.name}</h4>
                      <span className={`ven-field-req ${field.required.includes("No") ? "optional" : "required"}`}>
                        {field.required}
                      </span>
                    </div>
                    <div className="ven-schema-card-body">
                      <div className="ven-field-type">
                        <strong>Tipo de dato:</strong>
                        <code>{field.type}</code>
                      </div>
                      <p className="ven-field-desc">{field.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CRUD FORM MODAL (ADD & EDIT) ===== */}
      {showModal && (
        <div className="ven-modal-overlay">
          <div className="ven-modal-container">
            <div className="ven-modal-header">
              <h3>{modalMode === "create" ? "Registrar Nueva Venta" : "Editar Registro de Venta"}</h3>
              <button className="ven-modal-close-btn" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="ven-form">
              <div className="ven-form-grid">
                {/* Cliente */}
                <div className="ven-form-group span-2">
                  <label htmlFor="clienteId">Cliente Asociado<span className="required-mark">*</span></label>
                  <select 
                    id="clienteId" 
                    name="clienteId"
                    value={formData.clienteId}
                    onChange={handleInputChange}
                    className={`ven-select ${formErrors.clienteId ? "error" : ""}`}
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} — ({c.tipoDocumento} {c.documento})
                      </option>
                    ))}
                  </select>
                  {formErrors.clienteId && (
                    <span className="ven-field-error">{formErrors.clienteId}</span>
                  )}
                </div>

                {/* Producto */}
                <div className="ven-form-group span-2">
                  <label htmlFor="producto">Producto / Servicio Vendido<span className="required-mark">*</span></label>
                  <input 
                    type="text" 
                    id="producto"
                    name="producto"
                    placeholder="Ej. Licencia de Software, Computador Portátil"
                    value={formData.producto}
                    onChange={handleInputChange}
                    className={`ven-input ${formErrors.producto ? "error" : ""}`}
                  />
                  {formErrors.producto && (
                    <span className="ven-field-error">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {formErrors.producto}
                    </span>
                  )}
                </div>

                {/* Cantidad */}
                <div className="ven-form-group">
                  <label htmlFor="cantidad">Cantidad<span className="required-mark">*</span></label>
                  <input 
                    type="number" 
                    id="cantidad"
                    name="cantidad"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    className={`ven-input ${formErrors.cantidad ? "error" : ""}`}
                  />
                  {formErrors.cantidad && (
                    <span className="ven-field-error">{formErrors.cantidad}</span>
                  )}
                </div>

                {/* Precio Unitario */}
                <div className="ven-form-group">
                  <label htmlFor="precioUnitario">Precio Unitario ($ COP)<span className="required-mark">*</span></label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    id="precioUnitario"
                    name="precioUnitario"
                    min="0"
                    placeholder="Ej. 150.000"
                    value={formData.precioUnitario}
                    onChange={handleInputChange}
                    className={`ven-input ${formErrors.precioUnitario ? "error" : ""}`}
                  />
                  {formErrors.precioUnitario && (
                    <span className="ven-field-error">{formErrors.precioUnitario}</span>
                  )}
                </div>

                {/* Método Pago */}
                <div className="ven-form-group">
                  <label htmlFor="metodoPago">Método de Pago<span className="required-mark">*</span></label>
                  <select 
                    id="metodoPago" 
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleInputChange}
                    className="ven-select"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="ven-form-group">
                  <label htmlFor="estado">Estado de la Venta<span className="required-mark">*</span></label>
                  <select 
                    id="estado" 
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="ven-select"
                  >
                    <option value="Completada">Completada</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Total (Autocalculado) */}
                <div className="ven-form-group span-2">
                  <label htmlFor="total">Total Transacción (Calculado)</label>
                  <input 
                    type="text" 
                    id="total"
                    name="total"
                    value={formatCurrency(totalCalculado)}
                    disabled
                    className="ven-input"
                  />
                </div>
              </div>

              <div className="ven-modal-footer">
                <button type="button" className="ven-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ven-btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="ven-loading-spinner" style={{ width: "14px", height: "14px" }}></div>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Venta"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && ventaToDelete && (
        <div className="ven-modal-overlay">
          <div className="ven-modal-container delete-confirm">
            <div className="ven-delete-modal-content">
              <div className="ven-warning-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="ven-delete-text">
                <h4>¿Eliminar registro de venta permanentemente?</h4>
                <p>Esta acción eliminará la venta de <strong>{ventaToDelete.producto}</strong> realizada a <strong>{ventaToDelete.clienteNombre}</strong> por <strong>{formatCurrency(ventaToDelete.total)}</strong> de la base de datos de Firestore. Esta operación no se puede deshacer.</p>
              </div>
            </div>
            <div className="ven-modal-footer">
              <button type="button" className="ven-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </button>
              <button type="button" className="ven-btn-danger" onClick={handleConfirmDelete}>
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATION ALERTS ===== */}
      {toastAlert && (
        <div className={`ven-alert-toast ${toastAlert.type}`}>
          <span>{toastAlert.message}</span>
          <button className="ven-toast-close" onClick={() => setToastAlert(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Ventas;
