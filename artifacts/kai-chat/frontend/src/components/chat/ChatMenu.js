import { useState } from "react";
import { MoveHorizontal as MoreHorizontal, RotateCcw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, formatApiError } from "@/lib/api";

export const ChatMenu = ({ convId, onReset, onBackground, disabled }) => {
  const [confirm, setConfirm] = useState(false);

  const reset = async () => {
    try {
      const { data } = await api.post(`/conversations/${convId}/reset`);
      onReset(data.messages);
      toast.success("Chat resetado.");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={disabled} data-testid="chat-menu-btn" aria-label="Mais opções"
            className="h-11 w-11 shrink-0 rounded-full bg-black/50 backdrop-blur-md border border-white/15 grid place-items-center hover:bg-black/70 disabled:opacity-40">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800">
          <DropdownMenuItem onSelect={onBackground} data-testid="chat-background-option" className="gap-2">
            <ImageIcon className="h-4 w-4" /> Fundo do chat
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirm(true)} data-testid="chat-reset-option" className="gap-2 text-rose-400 focus:text-rose-300">
            <RotateCcw className="h-4 w-4" /> Resetar chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar chat?</AlertDialogTitle>
            <AlertDialogDescription>Todas as mensagens serão apagadas e a conversa recomeça pela intro do personagem.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="chat-reset-cancel-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={reset} data-testid="chat-reset-confirm-btn" className="bg-rose-600 hover:bg-rose-500">Resetar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
