// src/components/modals/ExpireModal.jsx
import React from "react";
import { useTheme } from "../../theme/useTheme";

export default function ExpireModal({ isOpen, onRetry, onGoBack }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.55)", padding: theme?.spacing?.md ?? 16 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-xl shadow-2xl p-6"
        style={{ background: theme.panel, border: `1px solid ${theme.border}` }}
      >
        <h3 style={{ ...theme.typography.h3, color: theme.primary, marginBottom: theme.spacing.md }}>
          Tempo esgotado
        </h3>

        <p style={{ marginBottom: theme.spacing.md, color: theme.text }}>
          Seu tempo para concluir o desafio acabou. Deseja tentar novamente ou voltar para a lista de desafios?
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onGoBack}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "transparent",
              border: `1px solid ${theme.border}`,
              color: theme.text,
              cursor: "pointer"
            }}
          >
            Voltar aos desafios
          </button>

          <button
            onClick={onRetry}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: theme.primary,
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}