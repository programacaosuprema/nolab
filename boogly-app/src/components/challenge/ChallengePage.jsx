// src/pages/ChallengePage.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AppContext } from "../../app_configuration/AppContext";
import { LoadingPage } from "../pages/LoadingPage";
import { ErrorPage } from "../pages/ErrorPage";

import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";
import { useAuth } from "../../autenticator/useAuth";

function getPercentageByResolutionsPTBR(solved = 0, attempts = 0) {
  solved = Number(solved) || 0;
  attempts = Number(attempts) || 0;

  if (attempts === 0) return "0,00 %";

  const pct = (solved / attempts) * 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(pct) + " %";
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { domainUrl } = useContext(AppContext);
  const { theme } = useTheme();
  const { showError } = useError();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const structure = searchParams.get("structure") || "list";

  // pega token / user do hook de autenticação
  const { token } = useAuth() || {};

  useEffect(() => {
    setLoading(true);
    setHasError(false);

    async function loadChallenges() {
      try {
        // monta headers (se tiver token, envia)
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${domainUrl}/challenges?structure=${structure}`, {
          method: "GET",
          credentials: "include",
          headers
        });

        if (!res.ok) {
          throw new Error("Erro ao carregar desafios");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Formato inválido da resposta");
        }

        // Se o backend já retornou userStatus/userAttempts em cada challenge, usa direto
        const hasUserStatus = data.length > 0 && typeof data[0].userStatus !== "undefined";
        const hasUserAttempts = data.length > 0 && typeof data[0].userAttempts !== "undefined";

        if (hasUserStatus && hasUserAttempts) {
          setChallenges(data);
          return;
        }

        // Caso backend não retorne userStatus/userAttempts: tenta buscar do usuário e mesclar
        if (token) {
          try {
            const meRes = await fetch(`${domainUrl}/users/me`, {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              }
            });

            if (meRes.ok) {
              const meData = await meRes.json();

              // POSSÍVEIS CAMPOS (varie conforme seu backend):
              // - meData.userChallenges : [{ challengeId, status, attempts }]
              // - meData.challenges : similar
              const userChallenges = meData.userChallenges || meData.challenges || [];

              // indexa por challengeId (pode ser _id ou publicId)
              const byChallengeId = new Map();
              for (const uc of userChallenges) {
                // uc.challengeId pode ser ObjectId ou objeto populado
                const key =
                  (uc.challengeId && (uc.challengeId._id || uc.challengeId)) ||
                  uc.challengePublicId ||
                  uc.challenge ||
                  uc.challengeId;

                if (key) byChallengeId.set(String(key), uc);
              }

              // mescla resultado: adiciona userStatus e userAttempts (se existir)
              const merged = data.map((c) => {
                const matchKeys = [
                  c._id && String(c._id),
                  c.publicId && String(c.publicId),
                ].filter(Boolean);

                let uc = null;
                for (const k of matchKeys) {
                  if (byChallengeId.has(k)) {
                    uc = byChallengeId.get(k);
                    break;
                  }
                }

                return {
                  ...c,
                  // status do usuário para este challenge
                  userStatus: uc?.status || c.userStatus || "pending",
                  // número de tentativas do usuário neste challenge
                  userAttempts: uc?.attempts ?? c.userAttempts ?? 0
                };
              });

              setChallenges(merged);
              return;
            }
          } catch (err) {
            // falhou ao buscar /users/me — ignora e segue com fallback
            console.warn("Não foi possível buscar user challenges:", err);
          }
        }

        // fallback: sem status específico -> assume pending, e sem tentativas individuais
        const fallback = data.map((c) => ({
          ...c,
          userStatus: c.userStatus || "pending",
          userAttempts: c.userAttempts ?? 0
        }));

        setChallenges(fallback);
      } catch (err) {
        console.error(err);
        showError(err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, [domainUrl, showError, structure, token]);

  // 🔥 LOADING
  if (loading) return <LoadingPage />;

  // 🔥 ERRO DE TELA (CORRETO)
  if (hasError) {
    return <ErrorPage message="Não foi possível carregar os desafios." />;
  }

  // 🔥 LISTA VAZIA
  if (challenges.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: theme.muted }}>
        Nenhum desafio encontrado
      </div>
    );
  }

  // 🔥 UI helpers (mantive seu visual)
  function getStatusUI(status) {
    const baseStyle = {
      ...theme.typography.badge,
      padding: "4px 8px",
      borderRadius: "999px"
    };

    switch (status) {
      case "completed":
        return (
          <span style={{ ...baseStyle, background: `${theme.success}20`, color: theme.success }}>
            🟢 Concluído
          </span>
        );

      case "attempted":
        return (
          <span style={{ ...baseStyle, background: `${theme.warning}20`, color: theme.warning }}>
            🟡 Tentando
          </span>
        );

      default:
        return (
          <span style={{ ...baseStyle, background: `${theme.danger}20`, color: theme.danger }}>
            🔴 Pendente
          </span>
        );
    }
  }

  function getDifficultyUI(difficulty) {
    const baseStyle = {
      ...theme.typography.badge,
      padding: "4px 8px",
      borderRadius: "999px"
    };

    switch (difficulty) {
      case "easy":
        return (
          <span style={{ ...baseStyle, background: `${theme.success}20`, color: theme.success }}>
            Fácil
          </span>
        );

      case "medium":
          return (
          <span style={{ ...baseStyle, background: `${theme.warning}20`, color: theme.warning }}>
            Médio
          </span>
        );

      default:
        return (
          <span style={{ ...baseStyle, background: `${theme.danger}20`, color: theme.danger }}>
            Difícil
          </span>
        );
    }
  }
  
  return (
  <div
    className="h-full flex flex-col"
    style={{
      background: theme.background,
      color: theme.text,
      padding: theme.spacing.lg
    }}
  >
    {/* 🔥 HEADER */}
    <div style={{ marginBottom: theme.spacing.lg }}>
      
      {/* 🔥 LINHA: VOLTAR + TÍTULO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.md,
          marginBottom: theme.spacing.sm
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: theme.card,
            color: theme.text,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            cursor: "pointer",
            ...theme.typography.small
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = theme.hover)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = theme.card)
          }
        >
          ← Voltar
        </button>
      </div>

      <h2
          style={{
            ...theme.typography.h2,
            color: theme.primary
          }}
        >
          Desafios
        </h2>

      {/* 🔥 SUBTÍTULO */}
      <p
        style={{
          ...theme.typography.body,
          color: theme.muted
        }}
      >
        Resolva problemas e evolua suas habilidades
      </p>
    </div>

    {/* 🔥 TABELA */}
    <div
      style={{
        background: theme.panel,
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${theme.border}`
      }}
    >
      {/* HEADER */}
      <div
        className="grid grid-cols-6"
        style={{
          padding: theme.spacing.md,
          ...theme.typography.small,
          color: theme.muted,
          borderBottom: `1px solid ${theme.border}`
        }}
      >
        <span>#</span>
        <span>Status</span>
        <span style={{ fontWeight: "bold" }}>Nome</span>
        <span>Dificuldade</span>
        <span>% Acertos</span>
        <span>Minhas Tentativas</span>
      </div>

      {/* LINHAS */}
      {challenges.map((c, index) => (
        
        <div
          key={c._id}
          onClick={() =>
            navigate(
              `/app/challenges/${c.publicId || c._id}?structure=${structure}`
            )
          }
          className="grid grid-cols-6 cursor-pointer"
          style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.border}`,
            ...theme.typography.body,
            alignItems: "center",
            transition: "0.2s"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = theme.hover)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span style={{ color: theme.muted }}>{index + 1}</span>

          <span>{getStatusUI(c.userStatus) || "pending"}</span>

          {/* 🔥 NOME DESTACADO */}
          <span
            style={{
              ...theme.typography.h3
            }}
          >
            {c.title}
          </span>

          <span>{getDifficultyUI(c.difficulty)}</span>

          <span style={{ color: theme.muted }}>
            {getPercentageByResolutionsPTBR(
              c.solvedCount,
              c.attempts
            )}
          </span>

          <span style={{ color: theme.muted }}>
            {c.userAttempts ?? "-"}
          </span>
        </div>
      ))}
    </div>
  </div>
);
}