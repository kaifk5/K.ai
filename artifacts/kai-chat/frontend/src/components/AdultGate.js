import { useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const AdultGate = () => {
  const { user, setUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  if (!user || user.adult_confirmed) return null;

  const confirm = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/auth/confirm-adult");
      setUser(data);
    } catch (e) {
      toast.error(formatApiError(e));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm grid place-items-center p-6" data-testid="adult-gate">
      <div className="max-w-sm w-full rounded-3xl bg-neutral-950 border border-neutral-800 p-6 text-center">
        <p className="font-display text-5xl font-extrabold text-[#FFE500]">18+</p>
        <h2 className="text-lg font-bold mt-3">Conteúdo para adultos</h2>
        <p className="text-sm text-neutral-400 mt-2">As conversas no K.ai podem conter temas adultos. Confirme que você tem 18 anos ou mais para continuar.</p>
        <button onClick={confirm} disabled={saving} data-testid="adult-gate-confirm-btn"
          className="w-full h-12 mt-6 rounded-full bg-[#FFE500] text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-60">
          Tenho 18 anos ou mais
        </button>
        <button onClick={logout} data-testid="adult-gate-exit-btn" className="w-full h-11 mt-2 text-sm text-neutral-500 hover:text-white">Sair</button>
      </div>
    </div>
  );
};
