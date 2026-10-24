import { Volume2 } from "lucide-react";
import { toast } from "sonner";
import { RichText, splitParagraphs, speak } from "@/lib/chatUtils";

const MiniBtn = ({ icon: Icon, onClick, label, testId }) => (
  <button onClick={onClick} aria-label={label} title={label} data-testid={testId}
    className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/25 grid place-items-center text-neutral-300 transition-colors">
    <Icon className="h-3.5 w-3.5" />
  </button>
);

export const AiMessage = ({ m, charName }) => (
  <div className="rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 p-3 space-y-3 max-w-[92%] fade-up" data-testid="chat-message-bubble-ai">
    {splitParagraphs(m.content).map((p, i) => (
      <div key={i} className="flex gap-2.5">
        <div className="flex flex-col gap-1 shrink-0 pt-0.5">
          <MiniBtn icon={Volume2} label="Ouvir" testId={`msg-listen-btn-${i}`}
            onClick={() => !speak(p) && toast.error("Seu navegador não suporta áudio.")} />
        </div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap"><RichText text={p} /></p>
      </div>
    ))}
  </div>
);

export const UserMessage = ({ m }) => (
  <div className="flex justify-end fade-up">
    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/15 backdrop-blur-md border border-white/15 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap"
      data-testid="chat-message-bubble-user">
      <RichText text={m.content} />
    </div>
  </div>
);
