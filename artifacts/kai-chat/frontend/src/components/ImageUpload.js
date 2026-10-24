import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

export const ImageUpload = ({ value, onChange, name, testId, rounded = "rounded-2xl", size = "h-20 w-20" }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um arquivo de imagem.");
    if (file.size > 5 * 1024 * 1024) return toast.error("A imagem deve ter no máximo 5 MB.");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post("/upload", body);
      onChange(data.url);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} data-testid={`${testId}-btn`}
        className={`relative ${size} ${rounded} overflow-hidden shrink-0 border border-neutral-800 group`}>
        <Avatar src={value} name={name || "?"} className="w-full h-full" />
        <span className="absolute inset-0 bg-black/50 grid place-items-center opacity-80 group-hover:opacity-100 transition-opacity">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </span>
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-sm font-semibold text-yellow-300 disabled:opacity-50" data-testid={`${testId}-pick`}>
          {uploading ? "Enviando..." : value ? "Trocar foto" : "Escolher foto"}
        </button>
        <span className="text-xs text-neutral-500">JPG, PNG, WEBP ou GIF até 5 MB</span>
        {value && !uploading && (
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-rose-400" data-testid={`${testId}-remove`}>
            <X className="h-3 w-3" /> Remover
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pick} data-testid={testId} />
    </div>
  );
};
