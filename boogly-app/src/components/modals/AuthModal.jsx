// src/components/auth/AuthModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../autenticator/useAuth";
import { Mail } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

export default function AuthModal({ isOpen, onClose }) {
  const { authenticate } = useAuth();
  const { theme } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // limpa estados quando abre
      setIdentifier("");
      setError("");
      // foco no input ao abrir
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!identifier.trim()) {
      setError("Digite seu e-mail ou nickname");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await authenticate(identifier.trim());
      onClose();
    } catch (err) {
      // err pode ser uma string ou Error
      setError((err && err.message) || String(err) || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  // permite enviar com Enter
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose && onClose();
    }
  }

  // fallback para propriedades de input que não existam no theme.js
  const inputBg = theme?.card ?? theme?.panel ?? (theme?.workspace || "#fff");
  const inputText = theme?.text ?? "#000";
  const inputPlaceholder = theme?.muted ?? "#9ca3af";
  const primaryColor = theme?.primary ?? "#3b82f6";
  const primaryHover = theme?.hover ?? primaryColor;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0,0,0,0.55)",
        padding: theme?.spacing?.md ?? "16px"
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl shadow-2xl relative"
        style={{
          background: theme?.panel,
          color: theme?.text,
          border: `1px solid ${theme?.border}`,
          boxSizing: "border-box"
        }}
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl"
          aria-label="Fechar"
          style={{
            color: theme?.muted,
            background: "transparent",
            border: "none",
            cursor: "pointer"
          }}
        >
          ✕
        </button>

        {/* TITLE */}
        <h2
          id="auth-modal-title"
          className="text-2xl font-bold mb-6 text-center"
          style={{
            margin: 0,
            color: theme?.text,
            ...theme?.typography?.h2
          }}
        >
          Entrar 🚀
        </h2>

        {/* INPUT */}
        <div
          className="rounded-xl p-4 flex gap-3 items-center mb-3"
          style={{
            background: inputBg,
            border: `1px solid ${theme?.border}`
          }}
        >
          <Mail style={{ color: inputPlaceholder }} />

          <input
            ref={inputRef}
            type="text"
            placeholder="E-mail ou nickname"
            className="w-full outline-none bg-transparent"
            style={{
              color: inputText,
              fontSize: theme?.typography?.body?.fontSize || "16px"
            }}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            aria-label="E-mail ou nickname"
            aria-invalid={!!error}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="mb-3 text-sm"
            role="alert"
            style={{ color: theme?.danger ?? "#ef4444" }}
          >
            {error}
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold transition"
          style={{
            background: loading ? primaryHover : primaryColor,
            color: theme?.text === "#fff" || theme?.text === "white" ? "#000" : "#000",
            opacity: loading ? 0.8 : 1,
            border: `1px solid ${theme?.border}`,
            cursor: loading ? "not-allowed" : "pointer"
          }}
          aria-busy={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}