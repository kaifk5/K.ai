import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";

const updatePointerSpot = (event) => {
  const point = event.touches?.[0] || event;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--pointer-x", `${point.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--pointer-y", `${point.clientY - bounds.top}px`);
  event.currentTarget.setAttribute("data-pointer-active", "true");
};

const clearPointerSpot = (event) => {
  event.currentTarget.setAttribute("data-pointer-active", "false");
};

export const CharacterCard = ({ c, onFavChange, index = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/c/${c.id}` } });
    try {
      const { data } = await api.post(`/characters/${c.id}/favorite`);
      onFavChange?.(c.id, data.is_favorite);
      toast.success(data.is_favorite ? "Adicionado aos favoritos" : "Removido dos favoritos");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <Link to={`/c/${c.id}`} data-testid={`character-card-${c.id}`} style={{ animationDelay: `${index * 40}ms` }}
      className="kai-interactive-surface fade-up mb-2 break-inside-avoid block rounded-xl bg-neutral-900 overflow-hidden group"
      data-pointer-active="false"
      onPointerMove={updatePointerSpot}
      onPointerLeave={clearPointerSpot}
      onPointerCancel={clearPointerSpot}
      onTouchStart={updatePointerSpot}
      onTouchMove={updatePointerSpot}
      onTouchEnd={clearPointerSpot}
      onTouchCancel={clearPointerSpot}>
      <div className={`relative overflow-hidden ${index % 3 === 1 ? "aspect-[3/4]" : "aspect-square"}`}>
        <Avatar src={c.avatar_url} name={c.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
          <MessageCircle className="h-3 w-3 fill-white" /> {formatCount(c.chat_count)}
        </span>
        <button onClick={toggleFav} data-testid={`character-favorite-btn-${c.id}`} aria-label="Favoritar"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:text-rose-400 transition-colors">
          <Heart className={`h-4 w-4 ${c.is_favorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-display text-[15px] font-bold leading-tight truncate">{c.name}</h3>
        <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{c.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[11px] bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full">{c.category}</span>
          {c.gender && c.gender !== "Outro" && <span className="text-[11px] bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full">{c.gender}</span>}
          }
        </div>
      </div>
    </Link>
  );
};

const formatCount = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(".", ",")}K` : n);
