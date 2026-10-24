import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Lock, Ghost, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { DeleteCharacterButton } from "@/components/DeleteCharacterButton";
import { PersonaDialog } from "@/components/profile/PersonaDialog";

const Empty = ({ icon: Icon, text, action, testId }) => (
  <div className="flex flex-col items-center text-center py-14" data-testid={testId}>
    <Icon className="h-12 w-12 text-neutral-700" />
    <p className="text-sm text-neutral-500 mt-3">{text}</p>
    {action}
  </div>
);

const createBtn = "mt-4 inline-flex items-center gap-1.5 px-6 h-11 rounded-full bg-[#FFE500] text-black font-bold hover:bg-yellow-300 transition-colors";
const row = "flex items-center gap-3 rounded-2xl bg-neutral-900 p-3";

export const CharactersTab = () => {
  const [chars, setChars] = useState(null);
  useEffect(() => { api.get("/characters/mine").then((r) => setChars(r.data)).catch(() => setChars([])); }, []);
  if (chars === null) return null;
  if (!chars.length) return <Empty icon={Ghost} text="Você ainda não criou nenhum personagem." testId="my-characters-empty"
    action={<Link to="/create" className={createBtn} data-testid="profile-create-btn"><Plus className="h-4 w-4" /> Criar</Link>} />;
    }
  return (
    <div className="space-y-2">
      <Link to="/create" className="flex items-center justify-center gap-1.5 h-11 rounded-full border border-dashed border-neutral-700 text-sm text-neutral-300 hover:border-yellow-300" data-testid="profile-create-btn">
        <Plus className="h-4 w-4" /> Criar personagem
      </Link>
      {chars.map((c) => (
        <div key={c.id} className={row} data-testid={`my-character-${c.id}`}>
          <Link to={`/c/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <span className="h-12 w-12 rounded-xl overflow-hidden shrink-0"><Avatar src={c.avatar_url} name={c.name} className="w-full h-full" /></span>
            <span className="min-w-0">
              <span className="font-display font-bold flex items-center gap-1.5">{c.name} {!c.is_public && <Lock className="h-3 w-3 text-neutral-500" />}</span>
              <span className="block text-xs text-neutral-500 truncate">{c.category} · {c.chat_count} conversas</span>
            </span>
          </Link>
          <Link to={`/edit/${c.id}`} className="p-2.5 rounded-full bg-neutral-800" data-testid={`character-edit-btn-${c.id}`} aria-label="Editar"><Pencil className="h-4 w-4" /></Link>
          <DeleteCharacterButton id={c.id} compact onDeleted={() => setChars((cs) => cs.filter((x) => x.id !== c.id))} />
        </div>
      ))}
    </div>
  );
};

export const PersonasTab = () => {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { api.get("/personas").then((r) => setList(r.data)).catch(() => setList([])); }, []);

  const openNew = () => { setEditing(null); setOpen(true); };
  const onSaved = (p) => setList((ls) => (ls.some((x) => x.id === p.id) ? ls.map((x) => (x.id === p.id ? p : x)) : [...ls, p]));
  const remove = async (p) => {
    if (!window.confirm(`Excluir a persona ${p.name}?`)) return;
    try { await api.delete(`/personas/${p.id}`); setList((ls) => ls.filter((x) => x.id !== p.id)); } catch (e) { toast.error(formatApiError(e)); }
  };

  if (list === null) return null;
  return (
    <div className="space-y-2">
      {!list.length ? (
        <Empty icon={UserRound} text="Crie uma persona para ser quem quiser nas conversas." testId="personas-empty"
          action={<button onClick={openNew} className={createBtn} data-testid="persona-create-btn"><Plus className="h-4 w-4" /> Criar</button>} />
          }
      ) : (
        <button onClick={openNew} data-testid="persona-create-btn" className="w-full flex items-center justify-center gap-1.5 h-11 rounded-full border border-dashed border-neutral-700 text-sm text-neutral-300 hover:border-yellow-300">
          <Plus className="h-4 w-4" /> Nova persona
        </button>
      )}
      {list.map((p) => (
        <div key={p.id} className={row} data-testid={`persona-item-${p.id}`}>
          <span className="h-12 w-12 rounded-full overflow-hidden shrink-0"><Avatar src={p.avatar_url} name={p.name} className="w-full h-full" /></span>
          <span className="flex-1 min-w-0">
            <span className="block font-display font-bold">{p.name}</span>
            <span className="block text-xs text-neutral-500 truncate">{[p.gender, p.age && `${p.age} anos`, p.description].filter(Boolean).join(" · ")}</span>
          </span>
          <button onClick={() => { setEditing(p); setOpen(true); }} className="p-2.5 rounded-full bg-neutral-800" data-testid={`persona-edit-btn-${p.id}`} aria-label="Editar"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => remove(p)} className="px-3 h-9 rounded-full bg-neutral-800 text-rose-400 text-xs" data-testid={`persona-delete-btn-${p.id}`}>Excluir</button>
        </div>
      ))}
      <PersonaDialog open={open} onOpenChange={setOpen} persona={editing} onSaved={onSaved} />
    </div>
  );
};
