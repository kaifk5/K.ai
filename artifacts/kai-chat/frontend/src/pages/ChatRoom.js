import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, AlertTriangle, Plus, Check, MessageCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError, mediaUrl } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { streamMessage } from "@/lib/stream";
import { AiMessage, UserMessage } from "@/components/chat/Messages";
import { PersonaChip } from "@/components/chat/PersonaChip";
import { ChatMenu } from "@/components/chat/ChatMenu";
import { CommentsSheet } from "@/components/chat/CommentsSheet";
import { BackgroundDialog } from "@/components/chat/BackgroundDialog";

const IntroCard = ({ c, saved, onSave }) => (
  <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 p-4" data-testid="chat-intro-card">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-xl font-extrabold">{c.name}</p>
        <p className="text-xs text-neutral-400">@{c.creator_name}</p>
      </div>
      <SaveButton saved={saved} onSave={onSave} testId="intro-save-btn" />
    </div>
    <p className="text-[11px] uppercase tracking-wider text-[#FFE500] font-semibold mt-3">Intro</p>
    <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{c.description}</p>
  </div>
);

const SaveButton = ({ saved, onSave, testId, compact }) => (
  <button onClick={onSave} data-testid={testId}
    className={`shrink-0 flex items-center gap-1 rounded-full font-semibold text-sm transition-colors ${compact ? "h-9 w-9 justify-center" : "px-3 h-8"} ${
      saved ? "bg-white/15 text-white" : "bg-[#FFE500] text-black hover:bg-yellow-300"}`}>
    {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {!compact && (saved ? "Salvo" : "Salvar")}
  </button>
);

export default function ChatRoom() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [persona, setPersona] = useState(null);
  const [saved, setSaved] = useState(false);
  const [usage, setUsage] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [background, setBackground] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.get(`/conversations/${id}`).then((r) => {
      setData(r.data); setMessages(r.data.messages); setPersona(r.data.persona); setSaved(r.data.character.is_favorite); setBackground(r.data.conversation.background_url || "");
    }).catch((e) => setLoadError(formatApiError(e)));
    api.get("/usage").then((r) => setUsage(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => { const el = endRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [messages]);

  const toggleSave = async () => {
    try {
      const r = await api.post(`/characters/${data.character.id}/favorite`);
      setSaved(r.data.is_favorite);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const send = async () => {
    const t = text.trim();
    if (!t || sending || usage?.remaining === 0) return;
    setError(""); setSending(true); setText("");
    const tmp = `tmp-${Date.now()}`;
    setMessages((ms) => [...ms, { id: tmp, role: "user", content: t }, { id: `${tmp}-ai`, role: "assistant", content: "", pending: true }]);
    try {
      const done = await streamMessage(id, t, (delta) =>
        setMessages((ms) => ms.map((m) => (m.id === `${tmp}-ai` ? { ...m, content: m.content + delta } : m))));
      setMessages((ms) => ms.map((m) => (m.id === `${tmp}-ai` ? { ...m, id: done.message_id, pending: false } : m)));
      setUsage(done.usage);
    } catch (e) {
      setMessages((ms) => ms.filter((m) => !m.id.startsWith(tmp)));
      setText(t); setError(e.message);
      api.get("/usage").then((r) => setUsage(r.data)).catch(() => {});
    } finally { setSending(false); }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  if (loadError) return (
    <div className="text-center py-24 px-4">
      <p className="text-rose-400" data-testid="chat-load-error">{loadError}</p>
      <Link to="/chat" className="text-yellow-300 text-sm font-semibold mt-3 inline-block">Voltar às conversas</Link>
    </div>
  );
  if (!data) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-500" /></div>;
  const c = data.character;
  const maxChars = usage?.max_chars || 1000;
  const limitReached = usage?.remaining === 0;

  return (
    <div className="fixed inset-0 md:relative md:inset-auto h-[100dvh] md:h-[calc(100dvh-4rem)] overflow-hidden max-w-3xl mx-auto flex flex-col" data-testid="chat-screen">
      <div className="absolute inset-0 -z-0">
        {background ? <img src={mediaUrl(background)} alt="" className="w-full h-full object-cover brightness-[0.6]" data-testid="chat-background" />
          : c.avatar_url && <img src={mediaUrl(c.avatar_url)} alt="" className="w-full h-full object-cover scale-110 blur-[6px] brightness-[0.35]" data-testid="chat-background" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/90" />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-3 py-3 shrink-0">
        <Link to="/chat" className="p-1.5 text-white" data-testid="chat-back-btn" aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></Link>
        <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left" data-testid="chat-character-link">
          <span className="h-9 w-9 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20"><Avatar src={c.avatar_url} name={c.name} className="w-full h-full" /></span>
          <span className="min-w-0">
            <span className="block font-display font-bold truncate leading-tight">{c.name}</span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-400 truncate">
              @{c.creator_name} · <MessageCircle className="h-3 w-3" /> {c.chat_count}
            </span>
          </span>
        </button>
        {usage && <span className="text-[11px] text-neutral-400 shrink-0" data-testid="rate-limit-badge">{usage.remaining}/{usage.daily_limit}</span>}
        <SaveButton saved={saved} onSave={toggleSave} testId="chat-header-save-btn" compact />
      </div>

      <div ref={endRef} className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3 pb-4 space-y-3" data-testid="chat-messages">
        <IntroCard c={c} saved={saved} onSave={toggleSave} />
        {messages.map((m) => m.role === "user" ? <UserMessage key={m.id} m={m} /> : m.pending && !m.content ? (
          <div key={m.id} className="flex items-center gap-1.5 px-4 py-3 w-fit rounded-2xl bg-black/55 backdrop-blur-md border border-white/10" data-testid="chat-typing-indicator">
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
        ) : <AiMessage key={m.id} m={m} charName={c.name} />)}
      </div>

      <div className="relative z-10 px-3 pb-3 pt-1 shrink-0 space-y-2">
        {limitReached && (
          <div className="flex items-start gap-2 rounded-xl bg-black/70 backdrop-blur-md border border-yellow-300/40 text-yellow-100 text-sm px-3 py-2" data-testid="daily-limit-banner">
            <Lock className="h-4 w-4 mt-0.5 shrink-0 text-yellow-300" />
            Você usou as {usage.daily_limit} mensagens de hoje. O envio volta à meia-noite (UTC).
          </div>
        )}
        {error && !limitReached && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-950/80 backdrop-blur-md border border-rose-500/30 text-rose-200 text-sm px-3 py-2" data-testid="rate-limit-error-alert">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-3xl bg-black/50 backdrop-blur-md border border-white/15 pl-4 pr-1.5 py-1.5">
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1} maxLength={maxChars} disabled={limitReached}
              placeholder={limitReached ? "Limite diário atingido" : "Enviar uma mensagem"} data-testid="chat-input-textarea"
              className="flex-1 resize-none max-h-32 bg-transparent py-2 text-[15px] placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed" />
            <button onClick={send} disabled={sending || limitReached || !text.trim()} data-testid="chat-send-button" aria-label="Enviar"
              className="h-9 w-9 shrink-0 rounded-full bg-[#FFE500] text-black grid place-items-center transition-opacity disabled:opacity-30">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <ChatMenu convId={id} disabled={sending} onReset={(ms) => { setMessages(ms); setError(""); }} onBackground={() => setBgOpen(true)} />
        </div>
        <div className="flex items-center justify-between">
          <PersonaChip convId={id} persona={persona} onChange={setPersona} />
          {text.length > maxChars * 0.8 && <span className="text-[11px] text-neutral-400" data-testid="chat-char-counter">{text.length}/{maxChars}</span>}
        </div>
      </div>
      <CommentsSheet open={commentsOpen} onOpenChange={setCommentsOpen} character={c} />
      <BackgroundDialog open={bgOpen} onOpenChange={setBgOpen} convId={id} current={background} characterAvatar={c.avatar_url} onChange={setBackground} />
    </div>
  );
}
