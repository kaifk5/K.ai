import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, formatApiError, CATEGORIES, GENDERS } from "@/lib/api";
import { ImageUpload } from "@/components/ImageUpload";

const input = "w-full rounded-xl bg-black border border-neutral-800 px-4 py-3 text-sm focus:outline-none focus:border-yellow-300 transition-colors";
const EMPTY = { name: "", category: "Romance", gender: "Masculino", description: "", personality: "", greeting: "", avatar_url: "", is_public: true };

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-neutral-200">{label}</span>
    {hint && <span className="block text-xs text-neutral-500 mb-1.5">{hint}</span>}
    }
    <div className={hint ? "" : "mt-1.5"}>{children}</div>
  </label>
);

export default function CharacterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/characters/${id}`).then(({ data }) => {
      if (!data.is_owner) return navigate(`/c/${id}`, { replace: true });
      setForm({ ...EMPTY, ...data, avatar_url: data.avatar_url || "" });
      setLoading(false);
    }).catch((e) => { setError(formatApiError(e)); setLoading(false); });
  }, [id, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, form[k]]));
    try {
      const { data } = id ? await api.put(`/characters/${id}`, payload) : await api.post("/characters", payload);
      toast.success(id ? "Personagem atualizado!" : "Personagem criado!");
      navigate(`/c/${data.id}`);
    } catch (err) {
      setError(formatApiError(err));
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-yellow-300" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-10 fade-up">
      <h1 className="text-4xl font-extrabold tracking-tight">{id ? "Editar personagem" : "Criar personagem"}</h1>
      <form onSubmit={submit} className="mt-6 p-5 md:p-6 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-5" data-testid="character-form">
        <Field label="Foto do personagem">
          <ImageUpload value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} name={form.name} testId="character-avatar-input" />
        </Field>
        <Field label="Nome">
          <input className={input} value={form.name} onChange={set("name")} required maxLength={60} data-testid="character-name-input" />
        </Field>
        <Field label="Categoria">
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-black border-neutral-800" data-testid="character-category-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              )
              }
            </SelectContent>
          </Select>
        </Field>
        <Field label="Gênero">
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-black border-neutral-800" data-testid="character-gender-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              )
              }
            </SelectContent>
          </Select>
        </Field>
        <Field label="Descrição curta" hint={`Aparece no catálogo · ${form.description.length}/300 (mín. 10)`}>
          <textarea className={input} rows={2} value={form.description} onChange={set("description")} required minLength={10} maxLength={300} data-testid="character-description-input" />
        </Field>
        <Field label="Personalidade" hint={`Como o personagem pensa, fala e age · ${form.personality.length}/2000 (mín. 10)`}>
          <textarea className={input} rows={5} value={form.personality} onChange={set("personality")} required minLength={10} maxLength={2000} data-testid="character-personality-input" />
        </Field>
        <Field label="Saudação inicial" hint="Primeira mensagem da conversa">
          <textarea className={input} rows={2} value={form.greeting} onChange={set("greeting")} required maxLength={500} data-testid="character-greeting-input" />
        </Field>
        <div className="flex items-center justify-between rounded-xl bg-black border border-neutral-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Público</p>
            <p className="text-xs text-neutral-500">Aparece no catálogo para todos</p>
          </div>
          <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} data-testid="character-public-switch" />
        </div>
        {error && <p className="text-sm text-rose-400" data-testid="character-form-error">{error}</p>}
        }
        <button type="submit" disabled={saving} data-testid="character-create-submit-btn"
          className="w-full h-12 rounded-full bg-[#FFE500] text-black hover:bg-yellow-300 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {id ? "Salvar alterações" : "Criar personagem"}
        </button>
      </form>
    </div>
  );
}
