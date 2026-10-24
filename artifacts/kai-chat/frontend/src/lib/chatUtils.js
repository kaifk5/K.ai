export const splitParagraphs = (text) => (text || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);

export const RichText = ({ text }) =>
  text.split(/(\*[^*]+\*|"[^"]+"|“[^”]+”)/g).filter(Boolean).map((seg, i) => {
    if (seg.length > 2 && seg.startsWith("*") && seg.endsWith("*"))
      return <span key={i} className="text-neutral-300 italic">{seg.slice(1, -1)}</span>;
    if (/^["“]/.test(seg)) return <span key={i} className="text-white font-semibold">{seg}</span>;
    return <span key={i} className="text-neutral-300">{seg}</span>;
  });

export const speak = (text) => {
  if (!window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\*/g, ""));
  u.lang = "pt-BR";
  window.speechSynthesis.speak(u);
  return true;
};

const wrap = (ctx, text, maxWidth) => {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
};

export const saveAsImage = (text, charName) => {
  const W = 1080, pad = 90, lh = 58;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = "500 40px 'Plus Jakarta Sans', sans-serif";
  const lines = wrap(ctx, text.replace(/\*/g, ""), W - pad * 2);
  canvas.width = W;
  canvas.height = pad * 2 + lines.length * lh + 110;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.fillStyle = "#FFE500";
  ctx.fillRect(pad, pad - 30, 80, 8);
  ctx.font = "500 40px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#f5f5f5";
  lines.forEach((l, i) => ctx.fillText(l, pad, pad + 40 + i * lh));
  ctx.font = "700 32px 'Outfit', sans-serif";
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(`${charName} · K.ai`, pad, canvas.height - pad + 20);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${charName}-kai.png`;
  a.click();
};
