import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";
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

const CLIENTES_COLLECTION = "clientes";

/**
 * Verifica si ya existe un cliente con el mismo tipo y número de documento.
 * @param {string} tipoDocumento 
 * @param {string} documento 
 * @param {string} [excludeId] - ID a excluir de la búsqueda (útil al editar un cliente existente).
 * @returns {Promise<boolean>} True si existe, False si no.
 */
export const checkDocumentoExiste = async (tipoDocumento, documento, excludeId = null) => {
  try {
    const clientesRef = collection(db, CLIENTES_COLLECTION);
    const q = query(
      clientesRef,
      where("tipoDocumento", "==", tipoDocumento),
      where("documento", "==", documento)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // Si hay registros, verificar si el ID no es el que estamos editando
    if (excludeId) {
      const match = querySnapshot.docs.find(doc => doc.id !== excludeId);
      return !!match;
    }
    
    return true;
  } catch (error) {
    console.error("Error al verificar documento existente:", error);
    throw error;
  }
};

/**
 * Suscribe a los cambios en tiempo real de la colección de clientes de un usuario.
 * @param {string} userId - ID del usuario actual.
 * @param {function(Cliente[]): void} callback - Función callback que recibe la lista actualizada de clientes.
 * @param {function(Error): void} [onError] - Callback opcional para manejar errores de la base de datos.
 * @returns {import("firebase/firestore").Unsubscribe} Función para cancelar la suscripción.
 */
export const subscribeClientes = (userId, callback, onError) => {
  const clientesRef = collection(db, CLIENTES_COLLECTION);
  const q = query(
    clientesRef,
    where("creadoPor", "==", userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const clientes = [];
    querySnapshot.forEach((docSnap) => {
      clientes.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Ordenar del más nuevo al más antiguo en el lado del cliente (evita requerir índice compuesto)
    clientes.sort((a, b) => {
      const timeA = a.fechaCreacion?.seconds || (a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() / 1000 : 0);
      const timeB = b.fechaCreacion?.seconds || (b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() / 1000 : 0);
      return timeB - timeA;
    });

    callback(clientes);
  }, (error) => {
    console.error("Error en suscripción de clientes:", error);
    if (onError) onError(error);
  });
};

/**
 * Agrega un nuevo cliente a Firestore.
 * @param {Omit<Cliente, 'id' | 'fechaCreacion' | 'creadoPor'>} clienteData 
 * @param {string} userId - ID del usuario actual que registra el cliente.
 * @returns {Promise<string>} ID del nuevo cliente creado.
 */
export const addCliente = async (clienteData, userId) => {
  try {
    // Validar duplicado antes de insertar
    const existe = await checkDocumentoExiste(clienteData.tipoDocumento, clienteData.documento);
    if (existe) {
      throw new Error(`Ya existe un cliente registrado con el documento ${clienteData.tipoDocumento} ${clienteData.documento}`);
    }

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
 * Obtiene todos los clientes registrados por un usuario específico de Firestore de forma única.
 * @param {string} userId - ID de usuario para filtrar por creador.
 * @returns {Promise<Cliente[]>} Lista de clientes.
 */
export const getClientes = async (userId) => {
  try {
    const clientesRef = collection(db, CLIENTES_COLLECTION);
    const q = query(
      clientesRef, 
      where("creadoPor", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const clientes = [];
    querySnapshot.forEach((docSnap) => {
      clientes.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Ordenar del más nuevo al más antiguo en el lado del cliente (evita requerir índice compuesto)
    clientes.sort((a, b) => {
      const timeA = a.fechaCreacion?.seconds || (a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() / 1000 : 0);
      const timeB = b.fechaCreacion?.seconds || (b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() / 1000 : 0);
      return timeB - timeA;
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
    // Si se está cambiando el documento, verificar duplicados excluyendo el cliente actual
    if (updatedData.tipoDocumento || updatedData.documento) {
      const existe = await checkDocumentoExiste(
        updatedData.tipoDocumento, 
        updatedData.documento, 
        id
      );
      if (existe) {
        throw new Error(`Ya existe otro cliente registrado con el documento ${updatedData.tipoDocumento} ${updatedData.documento}`);
      }
    }

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
