import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader as Loader2, Trash as Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

export default function Conversations() {
  const [convs, setConvs] = useState(null);

  useEffect(() => {
    api.get("/conversations").then((r) => setConvs(r.data)).catch((e) => { toast.error(formatApiError(e)); setConvs([]); });
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Apagar esta conversa e todo o histórico?")) return;
    try {
      await api.delete(`/conversations/${id}`);
      setConvs((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Conversas</h1>
      {convs === null && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-yellow-300" /></div>}
      }
      {convs?.length === 0 && (
        <p className="text-neutral-500 text-sm py-16" data-testid="conversations-empty">
          Nenhuma conversa ainda. <Link to="/" className="text-yellow-300 font-semibold">Explore o catálogo</Link>
        </p>
      )}
      <div className="mt-6 space-y-2">
        {convs?.map((c, i) => (
          <div key={c.id} className="fade-up flex items-center gap-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-yellow-300/40 transition-colors p-3"
            style={{ animationDelay: `${i * 40}ms` }}>
            <Link to={`/chat/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0" data-testid={`conversation-item-${c.id}`}>
              <div className="h-12 w-12 rounded-full overflow-hidden shrink-0">
                <Avatar src={c.character.avatar_url} name={c.character.name} className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold">{c.character.name}</p>
                <p className="text-xs text-neutral-400 truncate">{c.last_message}</p>
              </div>
            </Link>
            <span className="text-[11px] text-neutral-500 shrink-0">{new Date(c.updated_at).toLocaleDateString("pt-BR")}</span>
            <button onClick={() => remove(c.id)} className="p-2 text-neutral-500 hover:text-rose-400" data-testid={`conversation-delete-btn-${c.id}`} aria-label="Apagar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
