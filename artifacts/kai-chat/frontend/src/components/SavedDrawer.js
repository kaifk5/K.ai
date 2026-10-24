import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, Heart, Loader2, MessageCircle, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { api, formatApiError } from "@/lib/api";

export default function SavedDrawer({ open, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("conversations");
  const [conversations, setConversations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !user) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.allSettled([api.get("/conversations"), api.get("/favorites")])
      .then(([conversationsResult, favoritesResult]) => {
        if (cancelled) return;

        const failures = [];
        if (conversationsResult.status === "fulfilled") {
          setConversations(conversationsResult.value.data);
        } else {
          failures.push(conversationsResult.reason);
        }

        if (favoritesResult.status === "fulfilled") {
          setFavorites(favoritesResult.value.data);
        } else {
          failures.push(favoritesResult.reason);
        }

        if (failures.length) setError(formatApiError(failures[0]));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const removeConversation = async (event, conversation) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Apagar esta conversa e todo o histórico?")) return;

    try {
      await api.delete(`/conversations/${conversation.id}`);
      setConversations((items) => items.filter((item) => item.id !== conversation.id));
      toast.success("Conversa apagada");
    } catch (removeError) {
      toast.error(formatApiError(removeError));
    }
  };

  const removeFavorite = async (event, character) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await api.post(`/characters/${character.id}/favorite`);
      setFavorites((items) => items.filter((item) => item.id !== character.id));
      toast.success("Removido dos favoritos");
    } catch (removeError) {
      toast.error(formatApiError(removeError));
    }
  };

  const showingConversations = tab === "conversations";
  const items = showingConversations ? conversations : favorites;

  return (
    <div className="saved-drawer-layer" data-testid="saved-drawer">
      <button
        type="button"
        className="saved-drawer-backdrop"
        aria-label="Fechar conversas e favoritos"
        onClick={onClose}
      />
      <aside className="saved-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="saved-drawer-title">
        <div className="saved-drawer-header">
          <div className="min-w-0">
            <p className="saved-drawer-eyebrow">K.ai · espaço pessoal</p>
            <h2 id="saved-drawer-title" className="font-display text-2xl font-extrabold">Salvos</h2>
          </div>
          <button type="button" className="saved-drawer-close" onClick={onClose} aria-label="Fechar painel">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="saved-drawer-tabs" role="tablist" aria-label="Itens salvos">
          <button
            type="button"
            role="tab"
            aria-selected={showingConversations}
            className={`saved-drawer-tab ${showingConversations ? "is-active" : ""}`}
            onClick={() => setTab("conversations")}
            data-testid="saved-tab-conversations"
          >
            <MessageCircle className="h-4 w-4" />
            Conversas
            <span>{conversations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!showingConversations}
            className={`saved-drawer-tab ${!showingConversations ? "is-active" : ""}`}
            onClick={() => setTab("favorites")}
            data-testid="saved-tab-favorites"
          >
            <Heart className="h-4 w-4" />
            Favoritos
            <span>{favorites.length}</span>
          </button>
        </div>

        <div className="saved-drawer-content">
          {user === false ? (
            <div className="saved-drawer-empty">
              <Bookmark className="h-8 w-8 text-sky-300" />
              <p>Entre para ver suas conversas e personagens favoritos.</p>
              <Link to="/login" className="saved-drawer-login" onClick={onClose}>Entrar na conta</Link>
            </div>
          ) : user === null || loading ? (
            <div className="saved-drawer-loading"><Loader2 className="h-5 w-5 animate-spin" /> Carregando seus itens...</div>
          ) : error ? (
            <p className="saved-drawer-error">{error}</p>
          ) : items.length === 0 ? (
            <div className="saved-drawer-empty">
              {showingConversations ? <MessageCircle className="h-8 w-8 text-sky-300" /> : <Heart className="h-8 w-8 text-sky-300" />}
              <p>{showingConversations ? "Suas conversas aparecerão aqui." : "Seus personagens favoritos aparecerão aqui."}</p>
              <Link to="/" className="saved-drawer-login" onClick={onClose}>Explorar personagens</Link>
            </div>
          ) : (
            <div className="saved-drawer-list">
              {showingConversations
                ? conversations.map((conversation) => (
                  <div className="saved-drawer-row" key={conversation.id} data-testid={`saved-conversation-${conversation.id}`}>
                    <Link to={`/chat/${conversation.id}`} className="saved-drawer-item" onClick={onClose}>
                      <span className="saved-drawer-avatar">
                        <Avatar src={conversation.character?.avatar_url} name={conversation.character?.name} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="saved-drawer-name">{conversation.character?.name || "Personagem"}</span>
                        <span className="saved-drawer-preview">{conversation.last_message}</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="saved-drawer-action saved-drawer-delete"
                      onClick={(event) => removeConversation(event, conversation)}
                      aria-label={`Apagar conversa com ${conversation.character?.name || "personagem"}`}
                      data-testid={`saved-conversation-delete-${conversation.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
                : favorites.map((character) => (
                  <div className="saved-drawer-row" key={character.id} data-testid={`saved-favorite-${character.id}`}>
                    <Link to={`/c/${character.id}`} className="saved-drawer-item" onClick={onClose}>
                      <span className="saved-drawer-avatar">
                        <Avatar src={character.avatar_url} name={character.name} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="saved-drawer-name">{character.name}</span>
                        <span className="saved-drawer-preview">{character.category}</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="saved-drawer-action saved-drawer-favorite"
                      onClick={(event) => removeFavorite(event, character)}
                      aria-label={`Remover ${character.name} dos favoritos`}
                      data-testid={`saved-favorite-remove-${character.id}`}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {user && (
          <Link
            to={showingConversations ? "/chat" : "/favorites"}
            className="saved-drawer-footer"
            onClick={onClose}
          >
            Abrir página completa <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </aside>
    </div>
  );
}
