import { useEffect, useState } from "react";
import { Search, Loader as Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";

const TABS = [["seguindo", "Seguindo"], ["explorar", "Explorar"], ["hoje", "Hoje"], ["em-alta", "Em alta"], ["rpg", "RPG"]];
const GENDERS = ["Todos", "Masculino", "Feminino", "Outro"];
import { CharacterCard } from "@/components/CharacterCard";

export default function Home() {
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const [tab, setTab] = useState("explorar");
  const [gender, setGender] = useState("Todos");
  const [chars, setChars] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab === "seguindo" && user === false) { setChars([]); setError("Entre na sua conta para ver quem você segue."); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/characters", { params: { q, tab, gender: gender === "Todos" ? "" : gender } });
        setChars(data);
        setError("");
      } catch (e) {
        setError(formatApiError(e));
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, tab, gender, user]);

  const onFav = (id, val) => setChars((cs) => cs.map((c) => (c.id === id ? { ...c, is_favorite: val } : c)));

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-6 pt-4 md:pt-8">
      <div className="flex items-center gap-3 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar personagens" maxLength={60} data-testid="character-search-input"
            className="kai-search w-full h-11 pl-11 pr-4 rounded-full bg-neutral-900 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-700" />
        </div>
        <select value={gender} onChange={(e) => setGender(e.target.value)} data-testid="gender-select"
          className="bg-transparent text-sm text-neutral-300 font-medium focus:outline-none cursor-pointer">
          {GENDERS.map((g) => <option key={g} value={g} className="bg-neutral-900">{g}</option>)}
          )
          }
        </select>
      </div>

      <div className="flex gap-6 overflow-x-auto no-scrollbar mt-4 px-2 pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => { setError(""); setChars(null); setTab(id); }} data-testid={`tab-${id}`}
            aria-pressed={tab === id}
            data-active={tab === id ? "true" : "false"}
            className={`kai-tab shrink-0 text-[15px] transition-colors ${tab === id ? "text-white font-semibold" : "text-neutral-500 hover:text-neutral-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-center text-neutral-400 text-sm" data-testid="catalog-error">{error}</p>}
      }
      {chars === null && !error && <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-500" /></div>}
      }
      {chars && chars.length === 0 && !error && (
        <p className="text-neutral-500 text-sm py-16 text-center" data-testid="catalog-empty">Nenhum personagem encontrado.</p>
      )}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-2" data-testid="character-grid">
        {chars?.map((c, i) => (
          <div key={c.id}>
            {i === 2 && <CreateBanner />}
            <CharacterCard c={c} index={i} onFavChange={onFav} />
          </div>
        ))}
      </div>
    </div>
  );
}

const CreateBanner = () => (
  <Link to="/create" data-testid="create-banner" className="kai-create-banner mb-2 break-inside-avoid block rounded-xl overflow-hidden relative aspect-[4/5] bg-black border border-neutral-900">
    <div className="absolute inset-0 flex flex-col justify-end p-4">
      <Sparkles className="h-7 w-7 text-[#FFE500]" />
      <p className="font-display text-2xl font-extrabold leading-tight mt-2">Crie seu próprio <span className="text-[#FFE500]">personagem</span></p>
      <p className="text-xs text-neutral-400 mt-1">Personalidade, história e saudação do seu jeito.</p>
    </div>
  </Link>
);
