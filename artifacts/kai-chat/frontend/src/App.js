import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import StartChat from "@/pages/StartChat";
import AuthPage from "@/pages/AuthPage";
import CharacterForm from "@/pages/CharacterForm";
import Conversations from "@/pages/Conversations";
import Chat from "@/pages/ChatRoom";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/ProfilePage";
import { Loader2 } from "lucide-react";

const Protected = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (user === null)
    return (
      <div className="flex justify-center py-24" data-testid="auth-loading">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-300" />
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/c/:id" element={<StartChat />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/create" element={<Protected><CharacterForm /></Protected>} />
            <Route path="/edit/:id" element={<Protected><CharacterForm /></Protected>} />
            <Route path="/chat" element={<Protected><Conversations /></Protected>} />
            <Route path="/chat/:id" element={<Protected><Chat /></Protected>} />
            <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="top-center" theme="dark" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
