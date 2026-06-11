import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * @typedef {Object} Venta
 * @property {string} [id] - ID único autogenerado por Firestore.
 * @property {string} clienteId - ID único del cliente asociado.
 * @property {string} clienteNombre - Nombre completo del cliente para visualización.
 * @property {string} producto - Nombre o descripción del producto/concepto.
 * @property {number} cantidad - Cantidad vendida.
 * @property {number} precioUnitario - Precio unitario del producto/concepto.
 * @property {number} total - Total de la venta (cantidad * precioUnitario).
 * @property {string} metodoPago - Método de pago ('Efectivo' | 'Tarjeta' | 'Transferencia').
 * @property {string} estado - Estado de la venta ('Completada' | 'Pendiente' | 'Cancelada').
 * @property {string} creadoPor - ID de usuario del creador (uid).
 * @property {string} registradoPor - Nombre del usuario que registró la venta.
 * @property {import("firebase/firestore").Timestamp | Date} fechaCreacion - Fecha de registro.
 */

const VENTAS_COLLECTION = "ventas";

/**
 * Suscribe a los cambios en tiempo real de la colección de ventas de un usuario.
 * @param {string} userId - ID del usuario actual.
 * @param {function(Venta[]): void} callback - Función callback que recibe la lista actualizada de ventas.
 * @param {function(Error): void} [onError] - Callback opcional para manejar errores.
 * @returns {import("firebase/firestore").Unsubscribe} Función para cancelar la suscripción.
 */
export const subscribeVentas = (userId, callback, onError) => {
  const ventasRef = collection(db, VENTAS_COLLECTION);
  const q = query(
    ventasRef,
    where("creadoPor", "==", userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const ventas = [];
    querySnapshot.forEach((docSnap) => {
      ventas.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    // Ordenar del más nuevo al más antiguo en el lado del cliente (evita index compuesto)
    ventas.sort((a, b) => {
      const timeA = a.fechaCreacion?.seconds || (a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() / 1000 : 0);
      const timeB = b.fechaCreacion?.seconds || (b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() / 1000 : 0);
      return timeB - timeA;
    });

    callback(ventas);
  }, (error) => {
    console.error("Error en suscripción de ventas:", error);
    if (onError) onError(error);
  });
};

/**
 * Agrega una nueva venta a Firestore.
 * @param {Omit<Venta, 'id' | 'fechaCreacion' | 'creadoPor' | 'registradoPor'>} ventaData 
 * @param {string} userId - ID del usuario actual.
 * @param {string} userDisplayName - Nombre de pantalla del usuario.
 * @returns {Promise<string>} ID de la venta creada.
 */
export const addVenta = async (ventaData, userId, userDisplayName) => {
  try {
    const nuevaVenta = {
      ...ventaData,
      cantidad: Number(ventaData.cantidad),
      precioUnitario: Number(ventaData.precioUnitario),
      total: Number(ventaData.cantidad) * Number(ventaData.precioUnitario),
      creadoPor: userId,
      registradoPor: userDisplayName || "Usuario",
      fechaCreacion: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, VENTAS_COLLECTION), nuevaVenta);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar venta en Firestore:", error);
    throw error;
  }
};

/**
 * Actualiza los datos de una venta existente.
 * @param {string} id - ID de la venta a actualizar.
 * @param {Partial<Venta>} updatedData - Campos a actualizar.
 * @returns {Promise<void>}
 */
export const updateVenta = async (id, updatedData) => {
  try {
    const docRef = doc(db, VENTAS_COLLECTION, id);
    const dataToSave = { ...updatedData };
    
    // Si cambiaron cantidad o precioUnitario, recalculamos el total
    if (dataToSave.cantidad !== undefined || dataToSave.precioUnitario !== undefined) {
      const cantidad = dataToSave.cantidad !== undefined ? Number(dataToSave.cantidad) : 0;
      const precioUnitario = dataToSave.precioUnitario !== undefined ? Number(dataToSave.precioUnitario) : 0;
      dataToSave.cantidad = cantidad;
      dataToSave.precioUnitario = precioUnitario;
      dataToSave.total = cantidad * precioUnitario;
    }

    await updateDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error al actualizar venta en Firestore:", error);
    throw error;
  }
};

/**
 * Elimina una venta por su ID.
 * @param {string} id - ID de la venta a eliminar.
 * @returns {Promise<void>}
 */
export const deleteVenta = async (id) => {
  try {
    const docRef = doc(db, VENTAS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar venta de Firestore:", error);
    throw error;
  }
};
