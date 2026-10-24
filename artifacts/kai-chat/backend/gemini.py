"""Cliente mínimo do Gemini (API REST) com streaming.

Substitui a biblioteca `emergentintegrations`, que só funciona dentro do Emergent.
Usa apenas `requests` (já está no requirements.txt) e roda numa thread para não travar o servidor.
"""
import asyncio
import json
import os
import threading
from typing import AsyncIterator, Optional

import requests

BASE_URL = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
_END = object()


class GeminiError(Exception):
    pass


def build_contents(history: list, user_text: str) -> list:
    """Converte o histórico (roles user/assistant) para o formato do Gemini.

    O Gemini exige que a conversa comece com 'user' e aceita melhor papéis alternados,
    então mensagens seguidas do mesmo papel são juntadas.
    """
    contents: list = []

    def add(role: str, text: str):
        if contents and contents[-1]["role"] == role:
            contents[-1]["parts"][0]["text"] += "\n\n" + text
        else:
            contents.append({"role": role, "parts": [{"text": text}]})

    for m in history:
        add("model" if m["role"] == "assistant" else "user", m["content"])
    if contents and contents[0]["role"] == "model":
        contents.insert(0, {"role": "user", "parts": [{"text": "(O usuário iniciou a conversa.)"}]})
    add("user", user_text)
    return contents


def _stream_worker(api_key: str, model: str, system: str, contents: list, safety: Optional[list],
                   loop: asyncio.AbstractEventLoop, queue: "asyncio.Queue", stop: threading.Event):
    def put(item):
        loop.call_soon_threadsafe(queue.put_nowait, item)

    try:
        payload = {"systemInstruction": {"parts": [{"text": system}]}, "contents": contents}
        if safety:
            payload["safetySettings"] = safety
        resp = requests.post(f"{BASE_URL}/models/{model}:streamGenerateContent?alt=sse",
                             headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                             json=payload, stream=True, timeout=(10, 90))
        if resp.status_code != 200:
            try:
                detail = resp.json().get("error", {}).get("message", "")
            except Exception:
                detail = resp.text[:200]
            raise GeminiError(f"{resp.status_code} {detail}")
        resp.encoding = "utf-8"
        for line in resp.iter_lines(decode_unicode=True):
            if stop.is_set():
                break
            if not line or not line.startswith("data:"):
                continue
            data = json.loads(line[5:].strip())
            block = (data.get("promptFeedback") or {}).get("blockReason")
            if block:
                raise GeminiError(f"blocked: {block}")
            for cand in data.get("candidates") or []:
                for part in (cand.get("content") or {}).get("parts") or []:
                    if part.get("text") and not part.get("thought"):
                        put(part["text"])
        put(_END)
    except Exception as e:  # noqa: BLE001
        put(e)


async def stream_chat(api_key: str, model: str, system: str, history: list, user_text: str,
                      safety: Optional[list] = None) -> AsyncIterator[str]:
    """Gera os pedaços de texto da resposta conforme o Gemini os produz."""
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    stop = threading.Event()
    contents = build_contents(history, user_text)
    thread = threading.Thread(target=_stream_worker, daemon=True,
                              args=(api_key, model, system, contents, safety, loop, queue, stop))
    thread.start()
    try:
        while True:
            item = await queue.get()
            if item is _END:
                return
            if isinstance(item, Exception):
                raise item
            yield item
    finally:
        stop.set()
