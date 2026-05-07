import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
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
    querySnapshot.forEach((document) => {
      updateDoc(doc(db, "sessionHistory", document.id), {
        endTime: serverTimestamp(),
        status: "Finalizado",
      });
    });
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
    const displayNameParts = (user.displayName || "").split(" ");

    // Verificar si el usuario ya existe en Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Si no existe, crear un nuevo documento
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || "",
        nombre: displayNameParts[0] || "",
        apellidos: displayNameParts || "",
        apellidos: user.displayName.split(' ')[1] || "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        registroConFacebook: true,
      });
    }
    await logSessionStart(user);
    return user;
  };

  const signInWithGithub = async () => {
    const userCredential = await signInWithPopup(auth, githubProvider);
    const displayNameParts = (user.displayName || "").split(" ");

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || "",
        nombre: displayNameParts[0] || "",
        apellidos: displayNameParts || "",
        apellidos: user.displayName.split(' ')[1] || "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        registroConGithub: true,
      });
    }
    await logSessionStart(user);
    return user;
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