import { useEffect, useState } from "react";
import { Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, formatApiError, GENDERS } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";

const input = "w-full rounded-xl bg-black border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-300 transition-colors";
const EMPTY = { name: "", avatar_url: "", gender: "Feminino", age: "", appearance: "", description: "" };

export const PersonaDialog = ({ open, onOpenChange, persona, onSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(persona ? { ...EMPTY, ...persona, age: persona.age ?? "" } : EMPTY); setError(""); }
  }, [open, persona]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = { ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]])), age: form.age === "" ? null : Number(form.age) };
    try {
      const { data } = persona ? await api.put(`/personas/${persona.id}`, payload) : await api.post("/personas", payload);
      toast.success(persona ? "Persona atualizada!" : "Persona criada!");
      onSaved(data);
      onOpenChange(false);
    } catch (err) { setError(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border-neutral-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{persona ? "Editar persona" : "Nova persona"}</DialogTitle>
          <DialogDescription>Quem você será nas conversas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3" data-testid="persona-form">
          <ImageUpload value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} name={form.name} rounded="rounded-full" size="h-16 w-16" testId="persona-avatar-input" />
          <input className={input} placeholder="Nome" value={form.name} onChange={set("name")} required maxLength={40} data-testid="persona-name-input" />
          <div className="flex gap-2">
            <select className={input} value={form.gender} onChange={set("gender")} data-testid="persona-gender-select">
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              )
              }
            </select>
            <input className={input} type="number" min={18} max={999} placeholder="Idade (18+)" value={form.age} onChange={set("age")} data-testid="persona-age-input" />
          </div>
          <textarea className={input} rows={2} placeholder="Aparência" value={form.appearance} onChange={set("appearance")} maxLength={500} data-testid="persona-appearance-input" />
          <textarea className={input} rows={3} placeholder="Interesses e descrição" value={form.description} onChange={set("description")} maxLength={800} data-testid="persona-description-input" />
          {error && <p className="text-sm text-rose-400" data-testid="persona-form-error">{error}</p>}
          }
          <button type="submit" disabled={saving} data-testid="persona-save-btn"
            className="w-full h-11 rounded-full bg-[#FFE500] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar persona
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
