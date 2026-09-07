import { useEffect, useRef } from "react";
import { useTheme } from "../../theme/useTheme";

export default function Modal({ isOpen, onClose, title, children, width = 720 }) {
  const { theme } = useTheme();
  const closeRef = useRef();

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      <div
        className="relative rounded-2xl shadow-2xl p-6"
        style={{
          width: Math.min(width, window.innerWidth - 48),
          maxHeight: "85vh",
          overflow: "auto",
          background: theme?.panel,
          color: theme?.text,
          border: `1px solid ${theme?.border}`,
          zIndex: 60
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ margin: 0, ...theme?.typography?.h3 }}>{title}</h3>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: "transparent", border: "none", color: theme?.muted, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}