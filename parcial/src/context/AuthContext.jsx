import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  FacebookAuthProvider,
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

  const logSessionStart = async (user) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() || {};
    const displayNameParts = (user.displayName || "").split(" ");
    await addDoc(collection(db, "sessionHistory"), {
      userId: user.uid,
      nombre: userData.nombre || displayNameParts[0] || "",
      apellidos: userData.apellidos || displayNameParts[1] || "",
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

  const signup = async (email, password, userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Guardar datos adicionales en Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      nombre: userData.nombre,
      apellidos: userData.apellidos,
      createdAt: new Date(),
    });
  };

  const signin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await logSessionStart(userCredential.user);
  };

  const signInWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    const displayNameParts = (user.displayName || "").split(" ");

    // Verificar si el usuario ya existe en Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Si no existe, crear un nuevo documento
    if (!userDocSnap.exists()) {
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
    await logSessionStart(user);
    return user;
  };

  const signInWithFacebook = async () => {
    const userCredential = await signInWithPopup(auth, facebookProvider);
    const authUser = userCredential.user;
    const displayNameParts = (authUser.displayName || "").split(" ");

    // Obtener el Access Token para poder ver la foto real de Facebook
    const credential = FacebookAuthProvider.credentialFromResult(userCredential) || null;
    let fbPhotoURL = authUser.photoURL || "";
    
    if (fbPhotoURL && fbPhotoURL.includes("facebook.com")) {
      fbPhotoURL = fbPhotoURL + "?type=large";
      // Si tenemos el token de acceso, lo añadimos para evitar la silueta en blanco
      if (credential && credential.accessToken) {
        fbPhotoURL += "&access_token=" + credential.accessToken;
      }
    }

    // Verificar si el usuario ya existe en Firestore
    const userDocRef = doc(db, "users", authUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Si no existe, o si su foto estaba en blanco/silueta, la actualizamos
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
    await logSessionStart(authUser);
    return authUser;
  };

  const signInWithGithub = async () => {
    const userCredential = await signInWithPopup(auth, githubProvider);
    const authUser = userCredential.user;
    const displayNameParts = (authUser.displayName || "").split(" ");

    const userDocRef = doc(db, "users", authUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
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
    await logSessionStart(authUser);
    return authUser;
  };

  const logout = async () => {
    if (user) {
      await logSessionEnd(user.uid);
    }
    await signOut(auth);
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;