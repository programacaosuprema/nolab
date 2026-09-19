// src/pages/ErrorPage.jsx
import React, { useState } from 'react';
import { useTheme } from '../../theme/useTheme';
import { useNavigate } from 'react-router-dom';

export function ErrorPage({ message, code }) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const errorMessage = message || 'Algo deu errado';
  const errorCode = code || 'ERR_UNKNOWN';

  // estados de hover para botões (permite usar cores do theme sem manipular DOM)
  const [hoverRetry, setHoverRetry] = useState(false);
  const [hoverBack, setHoverBack] = useState(false);
  const [hoverHome, setHoverHome] = useState(false);

  const commonButtonStyle = {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 160ms ease',
    boxSizing: 'border-box',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{
        background: theme.background,
        color: theme.text,
        fontFamily: theme.typography?.body?.fontFamily || undefined,
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* cartão central para melhor leitura */}
      <div
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: `calc(${theme.spacing.lg} + 8px)`,
          maxWidth: 820,
          width: '100%',
          boxShadow: '0 8px 30px rgba(2,6,23,0.12)',
        }}
      >
        {/* Ícone */}
        <div
          className="mb-4"
          aria-hidden="true"
          style={{
            fontSize: theme.typography?.h1?.fontSize || '40px',
            color: theme.danger,
          }}
        >
          ⚠️
        </div>

        {/* Título */}
        <h1
          style={{
            margin: 0,
            marginBottom: theme.spacing.sm,
            color: theme.text,
            ...theme.typography?.h1,
          }}
        >
          Ocorreu um erro
        </h1>

        {/* Mensagem */}
        <p
          style={{
            margin: 0,
            marginBottom: theme.spacing.sm,
            maxWidth: 720,
            color: theme.danger,
            ...theme.typography?.body,
          }}
        >
          {errorMessage}
        </p>

        {/* Código */}
        <div
          style={{
            marginTop: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            color: theme.muted,
            ...theme.typography?.small,
          }}
        >
          Código: <span style={{ fontFamily: 'monospace' }}>{errorCode}</span>
        </div>

        {/* Botões */}
        <div
          className="flex gap-3 flex-wrap justify-center"
          style={{ marginTop: theme.spacing.md }}
        >
          {/* RELOAD */}
          <button
            onClick={() => window.location.reload()}
            aria-label="Tentar novamente"
            onMouseEnter={() => setHoverRetry(true)}
            onMouseLeave={() => setHoverRetry(false)}
            style={{
              ...commonButtonStyle,
              background: hoverRetry ? theme.hover : theme.primary,
              color: '#fff',
              boxShadow: hoverRetry ? `0 6px 18px ${theme.primary}33` : 'none',
            }}
          >
            🔄 Tentar novamente
          </button>

          {/* VOLTAR */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            onMouseEnter={() => setHoverBack(true)}
            onMouseLeave={() => setHoverBack(false)}
            style={{
              ...commonButtonStyle,
              background: hoverBack ? theme.active : theme.card,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              boxShadow: hoverBack ? `0 6px 18px ${theme.border}55` : 'none',
            }}
          >
            ← Voltar
          </button>

          {/* HOME */}
          <button
            onClick={() => navigate('/')}
            aria-label="Ir para a página inicial"
            onMouseEnter={() => setHoverHome(true)}
            onMouseLeave={() => setHoverHome(false)}
            style={{
              ...commonButtonStyle,
              background: hoverHome ? theme.hover : theme.success,
              color: '#fff',
              boxShadow: hoverHome ? `0 6px 18px ${theme.success}33` : 'none',
            }}
          >
            🏠 Início
          </button>
        </div>
      </div>
    </div>
  );
}
