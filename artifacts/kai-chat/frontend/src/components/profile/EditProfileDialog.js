import { useEffect, useState } from "react";
import { Loader as Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ImageUpload } from "@/components/ImageUpload";

const input = "w-full rounded-xl bg-black border border-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-300";

export const EditProfileDialog = ({ open, onOpenChange }) => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setForm({ name: user.name, avatar_url: user.avatar_url || "" }); setError(""); } }, [open, user]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const { data } = await api.put("/auth/me", form);
      setUser(data);
      onOpenChange(false);
    } catch (err) { setError(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border-neutral-800">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Seu nome e foto no K.ai.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3" data-testid="edit-profile-form">
          <input className={input} placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={40} data-testid="edit-profile-name-input" />
          <ImageUpload value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} name={form.name} rounded="rounded-full" testId="edit-profile-avatar-input" />
          {error && <p className="text-sm text-rose-400" data-testid="edit-profile-error">{error}</p>}
          }
          <button type="submit" disabled={saving} data-testid="edit-profile-save-btn"
            className="w-full h-11 rounded-full bg-[#FFE500] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
