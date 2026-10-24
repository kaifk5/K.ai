import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader as Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";

export default function Favorites() {
  const [chars, setChars] = useState(null);

  useEffect(() => {
    api.get("/favorites").then((r) => setChars(r.data)).catch(() => setChars([]));
  }, []);

  const onFav = (id, val) => !val && setChars((cs) => cs.filter((c) => c.id !== id));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
      <h1 className="text-4xl font-extrabold tracking-tight">Favoritos</h1>
      {chars === null && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-yellow-300" /></div>}
      }
      {chars?.length === 0 && (
        <p className="text-neutral-500 text-sm py-16" data-testid="favorites-empty">
          Você ainda não favoritou ninguém. <Link to="/" className="text-yellow-300 font-semibold">Explore o catálogo</Link>
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mt-6" data-testid="favorites-grid">
        {chars?.map((c, i) => <CharacterCard key={c.id} c={c} index={i} onFavChange={onFav} />)}
      </div>
    </div>
  );
}
