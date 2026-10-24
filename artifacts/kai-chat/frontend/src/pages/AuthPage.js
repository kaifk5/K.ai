import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Loader as Loader2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const field = "w-full h-12 px-4 rounded-xl bg-black border border-neutral-800 text-sm focus:outline-none focus:border-yellow-300 transition-colors";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", adult_confirmed: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dest = location.state?.from || "/";

  if (user) return <Navigate to={dest} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(`/auth/${isLogin ? "login" : "register"}`, payload);
      setUser(data);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-md mx-auto px-4 pt-10 md:pt-16 fade-up">
      <h1 className="text-4xl font-extrabold tracking-tight">{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
      <p className="text-neutral-400 mt-2 text-sm">{isLogin ? "Entre para continuar suas conversas." : "Leva menos de um minuto."}</p>
      <form onSubmit={submit} className="mt-8 space-y-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5" data-testid="auth-form">
        {!isLogin && (
          <input className={field} placeholder="Seu nome" value={form.name} onChange={set("name")} required minLength={2} maxLength={40} data-testid="auth-name-input" />
        )}
        <input className={field} type="email" placeholder="E-mail" value={form.email} onChange={set("email")} required maxLength={120} data-testid="auth-email-input" />
        <input className={field} type="password" placeholder={isLogin ? "Senha" : "Senha (mínimo 8 caracteres)"} value={form.password}
          onChange={set("password")} required minLength={isLogin ? 1 : 8} maxLength={128} data-testid="auth-password-input" />
        {!isLogin && (
          <label className="flex items-start gap-3 text-sm text-neutral-300 cursor-pointer py-1">
            <input type="checkbox" checked={form.adult_confirmed} onChange={(e) => setForm({ ...form, adult_confirmed: e.target.checked })}
              required className="mt-0.5 h-4 w-4 accent-[#FFE500]" data-testid="auth-adult-checkbox" />
            Tenho 18 anos ou mais e aceito conversas com conteúdo adulto.
          </label>
        )}
        {error && <p className="text-sm text-rose-400" data-testid="auth-error">{error}</p>}
        }
        <button type="submit" disabled={loading} data-testid={isLogin ? "auth-login-submit-btn" : "auth-signup-submit-btn"}
          className="w-full h-12 rounded-full bg-[#FFE500] text-black hover:bg-yellow-300 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {isLogin ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <p className="text-sm text-neutral-400 mt-5 text-center">
        {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
        <Link to={isLogin ? "/register" : "/login"} state={location.state} className="text-yellow-300 font-semibold" data-testid="auth-switch-link">
          {isLogin ? "Cadastre-se" : "Entrar"}
        </Link>
      </p>
    </div>
  );
}
