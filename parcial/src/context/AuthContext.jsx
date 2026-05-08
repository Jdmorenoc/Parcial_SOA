import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  FacebookAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  setDoc,
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider, githubProvider } from "../firebase/firebaseConfig";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("There isnt authprovider");
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logSessionStart = async (user, provider = "email") => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() || {};
    const displayNameParts = (user.displayName || "").split(" ");
    await addDoc(collection(db, "sessionHistory"), {
      userId: user.uid,
      email: user.email || userData.email || "",
      nombre: userData.nombre || displayNameParts[0] || "",
      apellidos: userData.apellidos || displayNameParts[1] || "",
      provider: provider,
      startTime: serverTimestamp(),
      endTime: null,
      status: "Activa",
    });
  };

  const logSessionEnd = async (userId) => {
    if (!userId) return;
    const q = query(
      collection(db, "sessionHistory"),
      where("userId", "==", userId),
      where("status", "==", "Activa")
    );
    const querySnapshot = await getDocs(q);
    
    // Esperar a que se actualicen todos los documentos antes de cerrar sesión
    const updatePromises = [];
    querySnapshot.forEach((document) => {
      updatePromises.push(
        updateDoc(doc(db, "sessionHistory", document.id), {
          endTime: serverTimestamp(),
          status: "Finalizado",
        })
      );
    });
    
    await Promise.all(updatePromises);
  };

  // Helper: check if an email already exists in Firestore and which provider it was registered with
  const checkEmailExists = async (email) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const existingUser = querySnapshot.docs[0].data();
      let registeredWith = "correo y contraseña";
      if (existingUser.registroConGoogle) registeredWith = "Google";
      else if (existingUser.registroConFacebook) registeredWith = "Facebook";
      else if (existingUser.registroConGithub) registeredWith = "GitHub";
      
      return { exists: true, registeredWith, uid: existingUser.uid };
    }
    return { exists: false };
  };

  const signup = async (email, password, userData) => {
    try {
      // 1. Verificar si el correo ya está registrado en Firestore (nuestra base de datos)
      const emailCheck = await checkEmailExists(email);
      if (emailCheck.exists) {
        throw new Error(`Este correo ya está registrado con ${emailCheck.registeredWith}. Por favor inicia sesión con ese método.`);
      }

      // 2. Intentar crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 3. Guardar datos adicionales en Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        createdAt: new Date(),
      });
    } catch (error) {
      // Mapear errores de Firebase a mensajes amigables
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Este correo ya está en uso. Por favor, intenta con otro o inicia sesión.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("El correo electrónico no es válido.");
      } else if (error.code === "auth/weak-password") {
        throw new Error("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Las credenciales son inválidas o han expirado.");
      }
      // Si ya es un Error con nuestro mensaje personalizado, lo volvemos a lanzar
      throw error;
    }
  };

  const signin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await logSessionStart(userCredential.user, "email");
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        throw new Error("Correo o contraseña incorrectos.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("El correo electrónico no es válido.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Demasiados intentos fallidos. Por favor, intenta más tarde.");
      }
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const displayNameParts = (user.displayName || "").split(" ");

      // Verificar si el correo ya existe con otro proveedor
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Verificar si el email ya está registrado con otro método (evitar duplicados por email)
        if (user.email) {
          const emailCheck = await checkEmailExists(user.email);
          if (emailCheck.exists && emailCheck.uid !== user.uid) {
            await signOut(auth);
            throw new Error(`El correo ${user.email} ya está registrado con ${emailCheck.registeredWith}. Por favor usa ese método para entrar.`);
          }
        }

        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          nombre: displayNameParts[0] || "",
          apellidos: displayNameParts[1] || "",
          photoURL: user.photoURL || "",
          createdAt: new Date(),
          registroConGoogle: true,
        });
      }
      await logSessionStart(user, "google");
      return user;
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        throw new Error("Ya existe una cuenta con este correo pero usando otro método de acceso.");
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("La ventana de autenticación fue cerrada antes de completar el proceso.");
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Error en las credenciales de Google. Por favor, intenta de nuevo.");
      }
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const userCredential = await signInWithPopup(auth, facebookProvider);
      const authUser = userCredential.user;
      const displayNameParts = (authUser.displayName || "").split(" ");

      const credential = FacebookAuthProvider.credentialFromResult(userCredential) || null;
      let fbPhotoURL = authUser.photoURL || "";
      
      if (fbPhotoURL && fbPhotoURL.includes("facebook.com")) {
        fbPhotoURL = fbPhotoURL + "?type=large";
        if (credential && credential.accessToken) {
          fbPhotoURL += "&access_token=" + credential.accessToken;
        }
      }

      const userDocRef = doc(db, "users", authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        if (authUser.email) {
          const emailCheck = await checkEmailExists(authUser.email);
          if (emailCheck.exists && emailCheck.uid !== authUser.uid) {
            await signOut(auth);
            throw new Error(`El correo ${authUser.email} ya está registrado con ${emailCheck.registeredWith}. Por favor usa ese método para entrar.`);
          }
        }
      }

      if (!userDocSnap.exists() || !userDocSnap.data().photoURL || userDocSnap.data().photoURL.includes("facebook.com")) {
        await setDoc(userDocRef, {
          uid: authUser.uid,
          email: authUser.email || "",
          nombre: displayNameParts[0] || "",
          apellidos: displayNameParts.slice(1).join(" ") || "",
          photoURL: fbPhotoURL,
          createdAt: userDocSnap.exists() ? userDocSnap.data().createdAt : new Date(),
          registroConFacebook: true,
        }, { merge: true });
      }
      await logSessionStart(authUser, "facebook");
      return authUser;
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        throw new Error("Ya existe una cuenta con este correo usando otro método (Google o Email).");
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Se cerró la ventana de Facebook.");
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Error en las credenciales de Facebook.");
      }
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const userCredential = await signInWithPopup(auth, githubProvider);
      const authUser = userCredential.user;
      const displayNameParts = (authUser.displayName || "").split(" ");

      const userDocRef = doc(db, "users", authUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        if (authUser.email) {
          const emailCheck = await checkEmailExists(authUser.email);
          if (emailCheck.exists && emailCheck.uid !== authUser.uid) {
            await signOut(auth);
            throw new Error(`El correo ${authUser.email} ya está registrado con ${emailCheck.registeredWith}. Por favor usa ese método para entrar.`);
          }
        }

        await setDoc(userDocRef, {
          uid: authUser.uid,
          email: authUser.email || "",
          nombre: displayNameParts[0] || "",
          apellidos: displayNameParts.slice(1).join(" ") || "",
          photoURL: authUser.photoURL || "",
          createdAt: new Date(),
          registroConGithub: true,
        });
      }
      await logSessionStart(authUser, "github");
      return authUser;
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        throw new Error("Ya existe una cuenta con este correo usando otro proveedor.");
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Se cerró la ventana de GitHub.");
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Error en las credenciales de GitHub.");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await logSessionEnd(user.uid);
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // --- Sistema de Auto-Cierre de Sesión (5 Minutos de Inactividad) ---
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Solo iniciamos el timer si hay un usuario logueado
      if (user) {
        timeoutId = setTimeout(() => {
          console.log("Sesión expirada por inactividad (5 minutos).");
          logout();
          alert("Tu sesión ha expirado por inactividad. Serás redirigido al login.");
        }, 5 * 60 * 1000); // 300,000ms = 5 minutos
      }
    };

    // Eventos que reinician el contador de inactividad
    const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"];

    if (user) {
      resetTimer();
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  useEffect(() => {
    const unsuscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsuscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        user,
        logout,
        loading,
        signInWithGoogle,
        signInWithFacebook,
        signInWithGithub,
        checkEmailExists,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;