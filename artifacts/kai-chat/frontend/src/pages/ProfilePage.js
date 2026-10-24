import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, LogOut, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { CharactersTab, PersonasTab } from "@/components/profile/ProfileTabs";

const Stat = ({ value, label, testId }) => (
  <div className="text-center" data-testid={testId}>
    <p className="font-display text-xl font-extrabold">{value ?? "–"}</p>
    <p className="text-xs text-neutral-500">{label}</p>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "persona" ? "persona" : "personagem";
  const [stats, setStats] = useState({});
  const [usage, setUsage] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    api.get("/profile/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/usage").then((r) => setUsage(r.data)).catch(() => {});
  }, []);

  const copyUid = async () => {
    try { await navigator.clipboard.writeText(user.id); toast.success("UID copiado!"); } catch (_) { toast.error("Não foi possível copiar."); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 fade-up">
      <div className="flex flex-col items-center text-center">
        <span className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-neutral-800"><Avatar src={user.avatar_url} name={user.name} className="w-full h-full text-3xl" /></span>
        <h1 className="text-2xl font-extrabold tracking-tight mt-3" data-testid="profile-name">{user.name}</h1>
        <button onClick={copyUid} data-testid="profile-uid-copy-btn" className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white mt-1 transition-colors">
          UID: {user.id.slice(0, 8)} <Copy className="h-3 w-3" />
        </button>
        <button onClick={() => setEditOpen(true)} data-testid="edit-profile-btn"
          className="mt-4 px-5 h-9 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-semibold hover:border-neutral-600 transition-colors">
          Editar perfil
        </button>
        <div className="grid grid-cols-3 gap-10 mt-6">
          <Stat value={stats.chats} label="Chats" testId="stat-chats" />
          <Stat value={stats.saved} label="Salvos" testId="stat-saved" />
          <Stat value={stats.followers} label="Seguidores" testId="stat-followers" />
        </div>
      </div>

      <div className="flex gap-8 border-b border-neutral-900 mt-8">
        {[["personagem", "Personagem"], ["persona", "Persona"]].map(([id, label]) => (
          <button key={id} onClick={() => setParams(id === "persona" ? { tab: "persona" } : {})} data-testid={`profile-tab-${id}`}
            className={`pb-3 text-[15px] font-semibold border-b-2 -mb-px transition-colors ${tab === id ? "border-[#FFE500] text-white" : "border-transparent text-neutral-500"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tab === "persona" ? <PersonasTab /> : <CharactersTab />}</div>

      <div className="mt-10 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-900 pt-4">
        {usage && <span className="flex items-center gap-1.5" data-testid="profile-usage"><Zap className="h-3.5 w-3.5 text-yellow-300" /> {usage.used_today}/{usage.daily_limit} mensagens hoje</span>}
        }
        <button onClick={async () => { await logout(); navigate("/"); }} data-testid="logout-btn" className="flex items-center gap-1.5 hover:text-rose-400">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
