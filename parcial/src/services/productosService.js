import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * @typedef {Object} Producto
 * @property {string} [id] - ID único autogenerado por Firestore.
 * @property {string} codigo - Código único del producto.
 * @property {string} nombre - Nombre del producto.
 * @property {string} descripcion - Descripción del producto.
 * @property {number} precio - Precio del producto.
 * @property {number} stock - Cantidad en inventario.
 * @property {string} categoria - Categoría del producto.
 * @property {string} estado - Estado del producto ('Activo' | 'Inactivo').
 * @property {string} creadoPor - ID de usuario del creador (uid).
 * @property {string} registradoPor - Nombre del usuario.
 * @property {import("firebase/firestore").Timestamp | Date} fechaCreacion - Fecha de registro.
 */

const PRODUCTOS_COLLECTION = "productos";

export const checkCodigoExiste = async (codigo, excludeId = null) => {
  try {
    const productosRef = collection(db, PRODUCTOS_COLLECTION);
    const q = query(productosRef, where("codigo", "==", codigo));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    if (excludeId) {
      const match = querySnapshot.docs.find(doc => doc.id !== excludeId);
      return !!match;
    }
    
    return true;
  } catch (error) {
    console.error("Error al verificar código existente:", error);
    throw error;
  }
};

export const subscribeProductos = (userId, callback, onError) => {
  const productosRef = collection(db, PRODUCTOS_COLLECTION);
  const q = query(
    productosRef,
    where("creadoPor", "==", userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const productos = [];
    querySnapshot.forEach((docSnap) => {
      productos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    productos.sort((a, b) => {
      const timeA = a.fechaCreacion?.seconds || (a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() / 1000 : 0);
      const timeB = b.fechaCreacion?.seconds || (b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() / 1000 : 0);
      return timeB - timeA;
    });

    callback(productos);
  }, (error) => {
    console.error("Error en suscripción de productos:", error);
    if (onError) onError(error);
  });
};

export const addProducto = async (productoData, userId, userDisplayName) => {
  try {
    const existe = await checkCodigoExiste(productoData.codigo);
    if (existe) {
      throw new Error(`Ya existe un producto registrado con el código ${productoData.codigo}`);
    }

    const nuevoProducto = {
      ...productoData,
      creadoPor: userId,
      registradoPor: userDisplayName || "Usuario",
      fechaCreacion: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, PRODUCTOS_COLLECTION), nuevoProducto);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar producto en Firestore:", error);
    throw error;
  }
};

export const updateProducto = async (id, updatedData) => {
  try {
    if (updatedData.codigo) {
      const existe = await checkCodigoExiste(updatedData.codigo, id);
      if (existe) {
        throw new Error(`Ya existe otro producto registrado con el código ${updatedData.codigo}`);
      }
    }

    const docRef = doc(db, PRODUCTOS_COLLECTION, id);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error al actualizar producto en Firestore:", error);
    throw error;
  }
};

export const deleteProducto = async (id) => {
  try {
    const docRef = doc(db, PRODUCTOS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar producto de Firestore:", error);
    throw error;
  }
};
