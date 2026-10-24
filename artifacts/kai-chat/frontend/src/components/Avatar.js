import { useState } from "react";
import { mediaUrl } from "@/lib/api";

export const Avatar = ({ src, name, className = "" }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <div className={`bg-gradient-to-br from-neutral-700 to-neutral-900 grid place-items-center font-display font-extrabold text-white ${className}`}>
        <span className="text-[max(1rem,30%)]">{(name || "?").charAt(0).toUpperCase()}</span>
      </div>
    );
  return <img src={mediaUrl(src)} alt={name} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
};
