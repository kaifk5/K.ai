import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Check, Plus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, formatApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

export const PersonaChip = ({ convId, persona, onChange }) => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);

  useEffect(() => {
    if (open && list === null) api.get("/personas").then((r) => setList(r.data)).catch(() => setList([]));
  }, [open, list]);

  const choose = async (p) => {
    try {
      const { data } = await api.put(`/conversations/${convId}/persona`, { persona_id: p?.id || null });
      onChange(data.persona);
      setOpen(false);
      toast.success(p ? `Agora você é ${p.name}` : "Persona removida");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} data-testid="persona-chip"
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-sm hover:bg-black/70 transition-colors">
        <span className="h-6 w-6 rounded-full overflow-hidden">
          <Avatar src={persona?.avatar_url} name={persona?.name || "?"} className="w-full h-full text-xs" />
        </span>
        <span className="font-medium" data-testid="persona-chip-name">{persona?.name || "Sem persona"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="bg-neutral-950 border-neutral-800 rounded-t-3xl max-h-[70vh] overflow-y-auto">
          <SheetHeader><SheetTitle>Escolher persona</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2" data-testid="persona-list">
            {list?.map((p) => (
              <button key={p.id} onClick={() => choose(p)} data-testid={`persona-option-${p.id}`}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-left transition-colors">
                <span className="h-10 w-10 rounded-full overflow-hidden shrink-0"><Avatar src={p.avatar_url} name={p.name} className="w-full h-full" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-xs text-neutral-500 truncate">{[p.gender, p.age && `${p.age} anos`].filter(Boolean).join(" · ")}</span>
                </span>
                {persona?.id === p.id && <Check className="h-5 w-5 text-[#FFE500]" />}
              </button>
            ))}
            {list?.length === 0 && <p className="text-sm text-neutral-500 py-2">Você ainda não tem personas.</p>}
            {persona && (
              <button onClick={() => choose(null)} data-testid="persona-option-none" className="w-full flex items-center gap-3 p-3 rounded-2xl text-neutral-400 hover:bg-neutral-900">
                <UserX className="h-5 w-5" /> Conversar sem persona
              </button>
            )}
            <Link to="/profile?tab=persona" data-testid="persona-create-link"
              className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-[#FFE500] text-black font-bold">
              <Plus className="h-4 w-4" /> Criar persona
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
