import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, ImagePlus, Loader2, UserSquare } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { api, formatApiError, mediaUrl } from "@/lib/api";

const cropToBlob = (src, area) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1080 / area.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(area.width * scale);
    canvas.height = Math.round(area.height * scale);
    canvas.getContext("2d").drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), "image/jpeg", 0.88);
  };
  img.onerror = reject;
  img.src = src;
});

const Option = ({ active, icon: Icon, title, onClick, testId, preview }) => (
  <button onClick={onClick} data-testid={testId}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${active ? "border-yellow-300 bg-yellow-300/10" : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"}`}>
    {preview ? <img src={preview} alt="" className="h-14 w-10 rounded-lg object-cover" /> : <span className="h-14 w-10 rounded-lg bg-neutral-800 grid place-items-center"><Icon className="h-5 w-5" /></span>}
    <span className="flex-1 font-semibold text-sm">{title}</span>
    {active && <Check className="h-5 w-5 text-yellow-300" />}
  </button>
);

export const BackgroundDialog = ({ open, onOpenChange, convId, current, characterAvatar, onChange }) => {
  const inputRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [saving, setSaving] = useState(false);

  const close = (v) => { if (!v) { if (src) URL.revokeObjectURL(src); setSrc(null); setZoom(1); } onOpenChange(v); };

  const save = async (url) => {
    const { data } = await api.put(`/conversations/${convId}/background`, { background_url: url });
    onChange(data.background_url);
  };

  const useCharacter = async () => {
    try { await save(""); toast.success("Fundo: foto do personagem"); close(false); } catch (e) { toast.error(formatApiError(e)); }
  };

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha um arquivo de imagem.");
    if (file.size > 15 * 1024 * 1024) return toast.error("Imagem muito grande (máx. 15 MB).");
    setSrc(URL.createObjectURL(file));
  };

  const apply = async () => {
    setSaving(true);
    try {
      const blob = await cropToBlob(src, area);
      const body = new FormData();
      body.append("file", blob, "fundo.jpg");
      const { data } = await api.post("/upload", body);
      await save(data.url);
      toast.success("Fundo atualizado!");
      close(false);
    } catch (e) { toast.error(formatApiError(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-neutral-950 border-neutral-800 max-h-[95vh] overflow-y-auto" data-testid="background-dialog">
        <DialogHeader>
          <DialogTitle>Fundo do chat</DialogTitle>
          <DialogDescription>{src ? "Arraste e dê zoom para recortar." : "Escolha o fundo desta conversa."}</DialogDescription>
        </DialogHeader>
        {src ? (
          <div className="space-y-4">
            <div className="relative h-[55vh] rounded-2xl overflow-hidden bg-black" data-testid="background-cropper">
              <Cropper image={src} crop={crop} zoom={zoom} aspect={9 / 16} onCropChange={setCrop} onZoomChange={setZoom}
                onCropComplete={(_, px) => setArea(px)} />
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([z]) => setZoom(z)} data-testid="background-zoom-slider" />
            <div className="flex gap-2">
              <button onClick={() => setSrc(null)} className="flex-1 h-11 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-semibold" data-testid="background-crop-cancel-btn">Voltar</button>
              <button onClick={apply} disabled={saving || !area} data-testid="background-crop-apply-btn"
                className="flex-1 h-11 rounded-full bg-[#FFE500] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Aplicar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Option active={!current} icon={UserSquare} title="Foto do personagem" onClick={useCharacter} testId="background-character-option"
              preview={characterAvatar ? mediaUrl(characterAvatar) : null} />
            <Option active={!!current} icon={ImagePlus} title={current ? "Trocar foto da galeria" : "Escolher foto da galeria"}
              onClick={() => inputRef.current?.click()} testId="background-gallery-option" preview={current ? mediaUrl(current) : null} />
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} data-testid="background-file-input" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
