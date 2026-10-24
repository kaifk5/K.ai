import { createContext, useContext, useEffect, useState } from "react";
import { api, refreshSession } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch (_) {
        try {
          await refreshSession();
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch (__) {
          setUser(false);
        }
      }
    };
    load();
  }, []);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
