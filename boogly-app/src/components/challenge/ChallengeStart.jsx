// src/components/challenge/ChallengeIntro.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";
import { useAuth } from "../../autenticator/useAuth";
import { AppContext } from "../../app_configuration/AppContext";

export function ChallengeStart({ challenge, onStart }) {
  const [tab, setTab] = useState("descricao");
  const { theme } = useTheme();
  const { showError } = useError();
  const { token } = useAuth();
  const { domainUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const test = challenge.testCases?.[0] || null;

  async function handleStart() {
    if (!onStart) {
      showError({ message: "Não foi possível iniciar o desafio" });
      return;
    }

    try {
      const id = challenge._id || challenge.publicId;

      const res = await fetch(`${domainUrl}/challenges/${id}/attempt`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!res.ok) {
        console.warn("attempt request falhou");
        onStart(null);
        return;
      }

      const data = await res.json();
      onStart(data?.userAttempt ?? null);
    } catch (err) {
      console.warn("Erro ao registrar attempt:", err);
      onStart(null);
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
      {/* 🔥 HEADER PADRÃO */}
      <div style={{ marginBottom: theme.spacing.lg }}>
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
            ...theme.typography.title,
            color: theme.primary
          }}
        >
          Desafios
        </h2>

        <p
          style={{
            ...theme.typography.text,
            color: theme.muted
          }}
        >
          Resolva problemas e evolua suas habilidades
        </p>
      </div>

      {/* 🔥 CONTAINER FULL WIDTH */}
      <div
        className="w-full flex-1 flex flex-col overflow-hidden"
        style={{
          background: theme.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: "12px"
        }}
      >
        {/* 🔥 TITLE */}
        <div
          style={{
            background: theme.primary,
            color: "#fff",
            padding: theme.spacing.lg,
            ...theme.typography.title
          }}
        >
          {challenge.title || "Desafio"}
        </div>

        {/* 🔥 TABS */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${theme.border}`
          }}
        >
          {["descricao", "entrada", "regras"].map((t) => {
            const active = tab === t;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  cursor: "pointer",
                  borderBottom: active
                    ? `2px solid ${theme.primary}`
                    : "2px solid transparent",
                  color: active ? theme.primary : theme.muted,
                  background: "transparent",
                  ...theme.typography.text
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* 🔥 CONTENT */}
        <div
          style={{
            padding: theme.spacing.lg,
            flex: 1,
            overflowY: "auto",
            ...theme.typography.text
          }}
        >
          {tab === "descricao" && (
            <div>
              <p>{challenge.description || "Sem descrição disponível."}</p>

              <p
                style={{
                  marginTop: theme.spacing.sm,
                  color: theme.muted,
                  ...theme.typography.small
                }}
              >
                OBS: Ao começar o desafio é contabilizado 1 tentativa.
              </p>
            </div>
          )}

          {tab === "entrada" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing.md
              }}
            >
              {test ? (
                <>
                  <div>
                    <span style={{ fontWeight: 600 }}>Entrada:</span>
                    <div
                      style={{
                        marginTop: theme.spacing.xs,
                        padding: theme.spacing.sm,
                        borderRadius: "6px",
                        background: theme.primary,
                        color: "#fff",
                        ...theme.typography.small
                      }}
                    >
                      {JSON.stringify(test.input)}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontWeight: 600 }}>Saída:</span>
                    <div
                      style={{
                        marginTop: theme.spacing.xs,
                        padding: theme.spacing.sm,
                        borderRadius: "6px",
                        background: theme.warning,
                        color: "#000",
                        ...theme.typography.small
                      }}
                    >
                      {JSON.stringify(test.expectedOutput)}
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ color: theme.muted }}>
                  Nenhum exemplo disponível.
                </p>
              )}
            </div>
          )}

          {tab === "regras" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing.sm
              }}
            >
              {(challenge.rules || []).length > 0 ? (
                challenge.rules.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: theme.spacing.sm,
                      alignItems: "flex-start",
                      ...theme.typography.small
                    }}
                  >
                    <span style={{ color: theme.success }}>✔</span>
                    <span>{r.description}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.muted }}>
                  Nenhuma regra definida.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 🔥 FOOTER */}
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            padding: theme.spacing.lg,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <button
            onClick={handleStart}
            style={{
              background: theme.primary,
              color: "#fff",
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: "8px",
              cursor: "pointer",
              ...theme.typography.text
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = theme.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = theme.primary)
            }
          >
            Começar desafio
          </button>
        </div>
      </div>
    </div>
  );
}