import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Loader2, MessageSquareText, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { api, formatApiError } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

const when = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const Comment = ({ c, onLike, onReply, onDelete, small }) => (
  <div className="flex gap-3" data-testid={`comment-${c.id}`}>
    <span className={`${small ? "h-7 w-7" : "h-9 w-9"} rounded-full overflow-hidden shrink-0`}><Avatar src={c.user_avatar} name={c.user_name} className="w-full h-full text-sm" /></span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-neutral-500"><span className="font-semibold text-neutral-200">{c.user_name}</span> · {when(c.created_at)}</p>
      <p className="text-sm text-neutral-200 mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
      <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-500">
        <button onClick={() => onLike(c)} data-testid={`comment-like-btn-${c.id}`} className={`flex items-center gap-1 transition-colors ${c.liked_by_me ? "text-rose-400" : "hover:text-white"}`}>
          <Heart className={`h-3.5 w-3.5 ${c.liked_by_me ? "fill-rose-500" : ""}`} /> <span data-testid={`comment-like-count-${c.id}`}>{c.like_count}</span>
        </button>
        <button onClick={() => onReply(c)} data-testid={`comment-reply-btn-${c.id}`} className="hover:text-white">Responder</button>
        {c.is_mine && (
          <button onClick={() => onDelete(c)} data-testid={`comment-delete-btn-${c.id}`} className="hover:text-rose-400" aria-label="Apagar"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  </div>
);

export const CommentsSheet = ({ open, onOpenChange, character }) => {
  const [items, setItems] = useState(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setItems(null); setReplyTo(null);
    api.get(`/characters/${character.id}/comments`).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [open, character.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/characters/${character.id}/comments`, { text, parent_id: replyTo?.id || null });
      setItems((xs) => [data, ...(xs || [])]);
      setText(""); setReplyTo(null);
    } catch (err) { toast.error(formatApiError(err)); } finally { setSending(false); }
  };

  const like = async (c) => {
    try {
      const { data } = await api.post(`/comments/${c.id}/like`);
      setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, ...data } : x)));
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const reply = (c) => { setReplyTo(c); inputRef.current?.focus(); };

  const remove = async (c) => {
    try { await api.delete(`/comments/${c.id}`); setItems((xs) => xs.filter((x) => x.id !== c.id && x.parent_id !== c.id)); } catch (err) { toast.error(formatApiError(err)); }
  };

  const top = (items || []).filter((c) => !c.parent_id);
  const repliesOf = (id) => (items || []).filter((c) => c.parent_id === id).reverse();
  const handlers = { onLike: like, onReply: reply, onDelete: remove };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-neutral-950 border-neutral-800 rounded-t-3xl h-[75vh] flex flex-col" data-testid="comments-sheet">
        <SheetHeader>
          <SheetTitle>Comentários sobre {character.name}</SheetTitle>
          <SheetDescription>@{character.creator_name}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-4">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 px-2" data-testid="comment-replying-to">
              <span>Respondendo a <span className="text-yellow-300 font-semibold">{replyTo.user_name}</span></span>
              <button type="button" onClick={() => setReplyTo(null)} data-testid="comment-reply-cancel-btn" aria-label="Cancelar resposta"><X className="h-4 w-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={500}
              placeholder={replyTo ? "Escreva sua resposta..." : "Deixe um comentário..."}
              data-testid="comment-input" className="flex-1 h-11 rounded-full bg-neutral-900 border border-neutral-800 px-4 text-sm focus:outline-none focus:border-yellow-300" />
            <button type="submit" disabled={sending || !text.trim()} data-testid="comment-submit-btn" aria-label="Enviar comentário"
              className="h-11 w-11 rounded-full bg-[#FFE500] text-black grid place-items-center disabled:opacity-30">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pb-4" data-testid="comments-list">
          {items === null && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-neutral-500" /></div>}
          {items?.length === 0 && (
            <div className="flex flex-col items-center py-10 text-neutral-500 text-sm" data-testid="comments-empty">
              <MessageSquareText className="h-10 w-10 text-neutral-700 mb-2" /> Seja o primeiro a comentar.
            </div>
          )}
          {top.map((c) => (
            <div key={c.id} className="space-y-3">
              <Comment c={c} {...handlers} />
              {repliesOf(c.id).length > 0 && (
                <div className="ml-12 space-y-3 border-l border-neutral-800 pl-3" data-testid={`comment-replies-${c.id}`}>
                  {repliesOf(c.id).map((r) => <Comment key={r.id} c={r} small {...handlers} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
