import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../../app_configuration/AppContext";
import { LoadingPage } from "../pages/LoadingPage";
import { ErrorPage } from "../pages/ErrorPage";

import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";
import { useLocation } from "react-router-dom";

export default function ChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { domainUrl } = useContext(AppContext);
  const { theme } = useTheme();
  const { showError } = useError();

  const navigate = useNavigate();

  const location = useLocation();
  const structure =
  location.state?.structure ||
  new URLSearchParams(location.search).get("structure") ||
  "list";

  useEffect(() => {
    setLoading(true);  
    setHasError(false);  

    async function loadChallenges() {
      try {
        const res = await fetch(`${domainUrl}/challenges?structure=${structure}`);

        if (!res.ok) {
          throw new Error("Erro ao carregar desafios");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Formato inválido da resposta");
        }

        setChallenges(data);

      } catch (err) {
        console.error(err);

        showError(err); // 🔥 toast global
        setHasError(true);

      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, [domainUrl, showError, structure]);

  // 🔥 LOADING
  if (loading) return <LoadingPage />;

  // 🔥 ERRO DE TELA (CORRETO)
  if (hasError) {
    return (
      <ErrorPage message="Não foi possível carregar os desafios." />
    );
  }

  // 🔥 LISTA VAZIA
  if (challenges.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ color: theme.muted }}
      >
        Nenhum desafio encontrado
      </div>
    );
  }

  // 🔥 STATUS
  function getStatusUI(status) {
    switch (status) {
      case "completed":
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.success}20`,
              color: theme.success
            }}
          >
            🟢 Concluído
          </span>
        );
      case "attempted":
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.warning}20`,
              color: theme.warning
            }}
          >
            🟡 Tentando
          </span>
        );
      default:
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.danger}20`,
              color: theme.danger
            }}
          >
            🔴 Pendente
          </span>
        );
    }
  }

  // 🔥 DIFICULDADE
  function getDifficultyUI(difficulty) {
    switch (difficulty) {
      case "easy":
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.success}20`,
              color: theme.success
            }}
          >
            Fácil
          </span>
        );
      case "medium":
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.warning}20`,
              color: theme.warning
            }}
          >
            Médio
          </span>
        );
      default:
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${theme.danger}20`,
              color: theme.danger
            }}
          >
            Difícil
          </span>
        );
    }
  }

  return (
    <div
      className="h-full p-4 flex flex-col"
      style={{
        background: theme.background,
        color: theme.text
      }}
    >

      {/* HEADER */}
      <div className="mb-6">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm"
          style={{
            background: theme.card,
            color: theme.text
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

        <h2 className="text-2xl font-bold">
          Desafios
        </h2>

        <p style={{ color: theme.muted }}>
          Resolva problemas e evolua suas habilidades
        </p>
      </div>

      {/* TABELA */}
      <div
        className="flex-1 overflow-hidden rounded-xl"
        style={{ background: theme.panel }}
      >
        <div className="h-full overflow-x-auto">
          <div className="min-w-[900px]">

            {/* HEADER */}
            <div
              className="grid grid-cols-6 px-6 py-3 text-sm border-b"
              style={{
                color: theme.muted,
                borderColor: theme.border
              }}
            >
              <span>Status</span>
              <span>#</span>
              <span>Nome</span>
              <span>Dificuldade</span>
              <span>Resoluções</span>
              <span>Tentativas</span>
            </div>

            {/* LINHAS */}
            {challenges.map((c, index) => (
              <div
                key={c.publicId || c._id}
                onClick={() => navigate(`/app/challenges/${c.publicId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/app/challenges/${c.publicId}`);
                  }
                }}
                className="grid grid-cols-6 px-6 py-3 border-b cursor-pointer transition"
                style={{
                  borderColor: theme.border
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = theme.hover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span>{getStatusUI(c.userStatus)}</span>

                <span style={{ color: theme.muted }}>
                  {index + 1}
                </span>

                <span className="font-medium">
                  {c.title}
                </span>

                <span>{getDifficultyUI(c.difficulty)}</span>

                <span>{c.solvedCount.toLocaleString()}</span>

                <span>{c.attempts}</span>
              </div>
            ))}

          </div>
        </div>
      </div>

    </div>
  );
}