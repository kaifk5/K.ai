import { API, refreshSession, formatApiError } from "@/lib/api";

const post = (convId, text) =>
  fetch(`${API}/conversations/${convId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

export async function streamMessage(convId, text, onDelta) {
  let res;
  try {
    res = await post(convId, text);
    if (res.status === 401) {
      await refreshSession();
      res = await post(convId, text);
    }
  } catch (_) {
    throw new Error("Sem conexão com o servidor. Verifique sua internet.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError({ detail: body.detail }));
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = null;
  while (true) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();
    for (const ev of events) {
      if (!ev.startsWith("data: ")) continue;
      const data = JSON.parse(ev.slice(6));
      if (data.type === "delta") onDelta(data.content);
      else if (data.type === "error") throw new Error(data.message);
      else if (data.type === "done") done = data;
    }
  }
  if (!done) throw new Error("A resposta foi interrompida. Tente novamente.");
  return done;
}
