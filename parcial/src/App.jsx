import { Routes, Route } from "react-router-dom";
import Home from "./components/home_menu/Home";
import LoginPage from "./login_menu/LoginPage";
import RegisterPage from "./register_menu/RegisterPage";
import ForgotPage from "./forgot_menu/ForgotPage";
import ResetPage from "./reset_menu/ResetPage";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import "./App.css";

function App() {
  return (
    <div className="w-full min-h-screen">
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoutes>
                <Home />
              </ProtectedRoutes>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPage />} />
          <Route path="/reset" element={<ResetPage />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
