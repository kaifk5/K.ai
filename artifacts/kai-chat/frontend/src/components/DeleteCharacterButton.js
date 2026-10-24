import { Trash as Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, formatApiError } from "@/lib/api";

export const DeleteCharacterButton = ({ id, onDeleted, compact = false }) => {
  const remove = async () => {
    try {
      await api.delete(`/characters/${id}`);
      toast.success("Personagem excluído.");
      onDeleted?.();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button data-testid={`character-delete-btn-${id}`} aria-label="Excluir"
          className={`flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 text-rose-400 hover:border-rose-500/50 transition-colors ${compact ? "p-2.5" : "px-4 h-12"}`}>
          <Trash2 className="h-4 w-4" /> {!compact && "Excluir"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-neutral-900 border-neutral-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
          <AlertDialogDescription>As conversas com este personagem também serão apagadas. Não é possível desfazer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="delete-cancel-btn">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={remove} data-testid="delete-confirm-btn" className="bg-rose-600 hover:bg-rose-500">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
