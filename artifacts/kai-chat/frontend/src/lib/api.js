import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;
export const api = axios.create({ baseURL: API, withCredentials: true });

let refreshing = null;
export const refreshSession = () => {
  if (!refreshing) {
    refreshing = axios.post(`${API}/auth/refresh`, {}, { withCredentials: true }).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config;
    if (error.response?.status === 401 && cfg && !cfg._retry && !cfg.url.startsWith("/auth/")) {
      cfg._retry = true;
      try {
        await refreshSession();
        return api(cfg);
      } catch (_) {
        /* fall through */
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(e) {
  const detail = e?.response?.data?.detail ?? e?.detail;
  if (detail == null) return e?.message === "Network Error" ? "Sem conexão com o servidor." : "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => (d?.msg || "").replace(/^Value error, /, "")).filter(Boolean).join(" ");
  return String(detail?.msg || detail);
}

export const CATEGORIES = ["Romance", "Drama", "RPG", "Fantasia", "Anime", "BL", "Aventura", "Ficção Científica", "Amizade", "Mistério", "Humor", "Outros"];
export const GENDERS = ["Masculino", "Feminino", "Outro"];

export const mediaUrl = (src) => (src && src.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL || ""}${src}` : src);

export const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
