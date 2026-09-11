import React, { useContext, useEffect, useState } from "react";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../autenticator/useAuth";
import { AppContext } from "../../app_configuration/AppContext";

// exemplo de helper
function formatDateIso(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(); // ou toLocaleDateString(), conforme preferir
  } catch {
    return String(iso);
  }
}


export default function StudentProfileModal({ isOpen, onClose, userProp = null }) {
  const { theme } = useTheme();
  const { user: ctxUser, token } = useAuth();
  const { domainUrl } = useContext(AppContext);

  const [user, setUser] = useState(userProp || ctxUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // sync when context user changes or prop changes
  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }
    setUser(ctxUser ?? null);
  }, [ctxUser, userProp]);

  
  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      if (user || !domainUrl) return;
      setLoading(true);
      try {
        const res = await fetch(`${domainUrl}/users/me`, {
          method: "GET",
          credentials: "include", // importante para cookie httpOnly ou cross-site cookie
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!mounted) return;
        if (!res.ok) {
          setError(`Erro ao carregar usuário (${res.status})`);
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        if (!mounted) return;
        setError("Erro de rede ao buscar usuário: ", err);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMe();

    return () => { mounted = false; };
  }, [domainUrl, token, user]);

  if (!isOpen) return null;

  const renderRow = (label, value) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: theme.spacing.sm }}>
      <div style={{ minWidth: 110, color: theme.muted, ...theme.typography.small }}>{label}:</div>
      <div style={{
        background: theme.background,
        border: `1px solid ${theme.border}`,
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderRadius: 8,
        color: theme.text,
        flex: 1,
        wordBreak: "break-word"
      }}>
        {value ?? <span style={{ color: theme.muted }}>—</span>}
      </div>
    </div>
  );

  const formatBool = (v) => (v ? "Sim" : "Não");

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.5)", padding: theme?.spacing?.md ?? 16 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-5"
        style={{ background: theme.panel, border: `1px solid ${theme.border}`, boxSizing: "border-box" }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
          <h3 style={{ ...theme.typography.h3, color: theme.text }}>Perfil do Aluno</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{ background: "transparent", border: "none", color: theme.muted, cursor: "pointer" }}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* body */}
        <div style={{ minHeight: 80 }}>
          {loading && <div style={{ color: theme.muted }}>Carregando...</div>}
          {error && <div style={{ color: "var(--danger, #dc2626)" }}>{error}</div>}

          {!loading && !error && (
            <>
            {renderRow("Apelido", user?.nickname)}
            {renderRow("Email", user?.email)}
            {renderRow("Visitante", formatBool(user?.guest))}
            {renderRow("Onboarding concluído", formatBool(user?.onboardingDone))}
            { renderRow("Data de Criação", formatDateIso(user?.createdAt)) }
            </> 
          )}
        </div>

        {/* footer - apenas fechar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: theme.spacing.md }}>
          <button
            onClick={onClose}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: 8,
              background: theme.primary,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}