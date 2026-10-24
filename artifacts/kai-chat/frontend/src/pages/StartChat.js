import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Loader as Loader2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function StartChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) return;
    if (!user) return navigate("/login", { replace: true, state: { from: location.pathname } });
    api.post("/conversations", { character_id: id })
      .then(({ data }) => navigate(`/chat/${data.id}`, { replace: true }))
      .catch((e) => setError(formatApiError(e)));
  }, [id, user, navigate, location.pathname]);

  if (error) return <p className="text-center text-rose-400 py-24 px-4" data-testid="start-chat-error">{error}</p>;
  return <div className="flex justify-center py-24" data-testid="start-chat-loading"><Loader2 className="h-6 w-6 animate-spin text-neutral-500" /></div>;
}
