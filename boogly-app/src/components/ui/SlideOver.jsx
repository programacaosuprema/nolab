import { useEffect } from "react";
import { useTheme } from "../../theme/useTheme";

export default function SlideOver({ isOpen, onClose, title, width = 520, children }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)" }} onClick={onClose} />
      <aside
        className="relative h-full shadow-2xl"
        style={{
          width: Math.min(width, window.innerWidth - 24),
          background: theme?.panel,
          color: theme?.text,
          borderLeft: `1px solid ${theme?.border}`,
          padding: theme?.spacing?.lg || 20,
          overflow: "auto"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ margin: 0, ...theme?.typography?.h3 }}>{title}</h3>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "transparent", border: "none", color: theme?.muted }}>✕</button>
        </div>

        <div>
          {children}
        </div>
      </aside>
    </div>
  );
}