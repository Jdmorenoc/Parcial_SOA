import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * @typedef {Object} Cliente
 * @property {string} [id] - ID único autogenerado por Firestore.
 * @property {string} tipoDocumento - Tipo de identificación (ej. CC, CE, NIT, PP).
 * @property {string} documento - Número de documento de identidad (único).
 * @property {string} nombres - Nombres del cliente.
 * @property {string} apellidos - Apellidos del cliente.
 * @property {string} email - Correo electrónico de contacto.
 * @property {string} [telefono] - Número telefónico (opcional).
 * @property {string} [direccion] - Dirección de contacto (opcional).
 * @property {string} estado - Estado del cliente ('Activo' | 'Inactivo').
 * @property {string} creadoPor - ID de usuario del creador (uid).
 * @property {import("firebase/firestore").Timestamp | Date} fechaCreacion - Fecha de registro.
 */

// Colección de Firestore
const CLIENTES_COLLECTION = "clientes";

/**
 * Clientes mock iniciales estructurados para pruebas en la interfaz visual.
 * @type {Cliente[]}
 */
export const MOCK_CLIENTES = [
  {
    id: "mock-1",
    tipoDocumento: "CC",
    documento: "1098765432",
    nombres: "Juan Carlos",
    apellidos: "Pérez Gómez",
    email: "juan.perez@example.com",
    telefono: "3151234567",
    direccion: "Calle 100 #15-22, Bogotá",
    estado: "Activo",
    creadoPor: "system",
    fechaCreacion: new Date("2026-05-10T14:30:00Z"),
  },
  {
    id: "mock-2",
    tipoDocumento: "NIT",
    documento: "900.123.456-7",
    nombres: "Tecnologías y Soluciones",
    apellidos: "S.A.S.",
    email: "contacto@tecnosoluciones.co",
    telefono: "6015551234",
    direccion: "Avenida El Dorado #68C-24, Bogotá",
    estado: "Activo",
    creadoPor: "system",
    fechaCreacion: new Date("2026-06-01T09:15:00Z"),
  },
  {
    id: "mock-3",
    tipoDocumento: "CE",
    documento: "987654",
    nombres: "Sarah",
    apellidos: "Connor Davis",
    email: "sarah.connor@example.com",
    telefono: "3209876543",
    direccion: "Carrera 7 #72-10, Bogotá",
    estado: "Inactivo",
    creadoPor: "system",
    fechaCreacion: new Date("2026-06-08T17:45:00Z"),
  }
];

/**
 * Agrega un nuevo cliente a Firestore.
 * @param {Omit<Cliente, 'id' | 'fechaCreacion' | 'creadoPor'>} clienteData 
 * @param {string} userId - ID del usuario actual que registra el cliente.
 * @returns {Promise<string>} ID del nuevo cliente creado.
 */
export const addCliente = async (clienteData, userId) => {
  try {
    const nuevoCliente = {
      ...clienteData,
      creadoPor: userId,
      fechaCreacion: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, CLIENTES_COLLECTION), nuevoCliente);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar cliente en Firestore:", error);
    throw error;
  }
};

/**
 * Obtiene todos los clientes registrados por un usuario específico de Firestore.
 * Si no se pasa un userId, intenta obtener todos los clientes disponibles.
 * @param {string} [userId] - Opcional. ID de usuario para filtrar por creador.
 * @returns {Promise<Cliente[]>} Lista de clientes.
 */
export const getClientes = async (userId) => {
  try {
    const clientesRef = collection(db, CLIENTES_COLLECTION);
    let q;
    
    if (userId) {
      q = query(clientesRef, where("creadoPor", "==", userId), orderBy("fechaCreacion", "desc"));
    } else {
      q = query(clientesRef, orderBy("fechaCreacion", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    const clientes = [];
    querySnapshot.forEach((docSnap) => {
      clientes.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return clientes;
  } catch (error) {
    console.error("Error al obtener clientes de Firestore:", error);
    throw error;
  }
};

/**
 * Actualiza los datos de un cliente existente.
 * @param {string} id - ID del cliente a actualizar.
 * @param {Partial<Cliente>} updatedData - Campos a actualizar.
 * @returns {Promise<void>}
 */
export const updateCliente = async (id, updatedData) => {
  try {
    const docRef = doc(db, CLIENTES_COLLECTION, id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error al actualizar cliente en Firestore:", error);
    throw error;
  }
};

/**
 * Elimina un cliente por su ID.
 * @param {string} id - ID del cliente a eliminar.
 * @returns {Promise<void>}
 */
export const deleteCliente = async (id) => {
  try {
    const docRef = doc(db, CLIENTES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar cliente de Firestore:", error);
    throw error;
  }
};
