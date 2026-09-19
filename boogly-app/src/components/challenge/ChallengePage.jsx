// src/pages/ChallengePage.jsx
import { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../../app_configuration/AppContext';
import { LoadingPage } from '../pages/LoadingPage';
import { ErrorPage } from '../pages/ErrorPage';
import { useTheme } from '../../theme/useTheme';
import { useError } from '../../error/useError';
import { getChallenges } from '../../services/challengeService';
import { getUserChallenges } from '../../services/userService';
import { mergeChallengesWithUser } from '../../services/mergeService';

function getPercentageByResolutionsPTBR(solved = 0, attempts = 0) {
  solved = Number(solved) || 0;
  attempts = Number(attempts) || 0;

  if (attempts === 0) return '0,00 %';

  const pct = (solved / attempts) * 100;
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pct) + ' %'
  );
}

export default function ChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { domainUrl, mainRoute } = useContext(AppContext);
  const { theme } = useTheme();
  const { showError } = useError();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const structure = searchParams.get('structure') || 'list';

  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoading(true);

        const challengesData = await getChallenges({
          domainUrl,
          structure,
        });

        const hasUserData =
          challengesData.length > 0 &&
          typeof challengesData[0].userStatus !== 'undefined';

        if (hasUserData) {
          setChallenges(challengesData);
          return;
        }

        const userChallenges = await getUserChallenges({ domainUrl });

        const merged = mergeChallengesWithUser(challengesData, userChallenges);

        setChallenges(merged);
      } catch (err) {
        console.error(err);
        showError(err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    if (domainUrl && structure) {
      loadChallenges();
    }
  }, [domainUrl, structure, showError]);
  // 🔥 LOADING
  if (loading) return <LoadingPage />;

  // 🔥 ERRO DE TELA (CORRETO)
  if (hasError) {
    return <ErrorPage message="Não foi possível carregar os desafios." />;
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

  // 🔥 UI helpers (mantive seu visual)
  function getStatusUI(status) {
    const baseStyle = {
      ...theme.typography.badge,
      padding: '4px 8px',
      borderRadius: '999px',
    };

    switch (status) {
      case 'completed':
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.success}20`,
              color: theme.success,
            }}
          >
            🟢 Concluído
          </span>
        );

      case 'attempted':
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.warning}20`,
              color: theme.warning,
            }}
          >
            🟡 Tentando
          </span>
        );

      default:
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.danger}20`,
              color: theme.danger,
            }}
          >
            🔴 Pendente
          </span>
        );
    }
  }

  function getDifficultyUI(difficulty) {
    const baseStyle = {
      ...theme.typography.badge,
      padding: '4px 8px',
      borderRadius: '999px',
    };

    switch (difficulty) {
      case 'easy':
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.success}20`,
              color: theme.success,
            }}
          >
            Fácil
          </span>
        );

      case 'medium':
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.warning}20`,
              color: theme.warning,
            }}
          >
            Médio
          </span>
        );

      default:
        return (
          <span
            style={{
              ...baseStyle,
              background: `${theme.danger}20`,
              color: theme.danger,
            }}
          >
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
        padding: theme.spacing.lg,
      }}
    >
      {/* 🔥 HEADER */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        {/* 🔥 LINHA: VOLTAR + TÍTULO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: theme.card,
              color: theme.text,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              ...theme.typography.small,
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
            color: theme.primary,
          }}
        >
          Desafios
        </h2>

        {/* 🔥 SUBTÍTULO */}
        <p
          style={{
            ...theme.typography.body,
            color: theme.muted,
          }}
        >
          Resolva problemas e evolua suas habilidades
        </p>
      </div>

      {/* 🔥 TABELA */}
      <div
        style={{
          background: theme.panel,
          borderRadius: '12px',
          overflow: 'hidden',
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* HEADER */}
        <div
          className="grid grid-cols-6"
          style={{
            padding: theme.spacing.md,
            ...theme.typography.small,
            color: theme.muted,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <span>#</span>
          <span>Status</span>
          <span style={{ fontWeight: 'bold' }}>Nome</span>
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
                `${mainRoute}/challenges/${c.publicId || c._id}?structure=${structure}`
              )
            }
            className="grid grid-cols-6 cursor-pointer"
            style={{
              padding: theme.spacing.md,
              borderBottom: `1px solid ${theme.border}`,
              ...theme.typography.body,
              alignItems: 'center',
              transition: '0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = theme.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <span style={{ color: theme.muted }}>{index + 1}</span>

            <span>{getStatusUI(c.userStatus) || 'pending'}</span>

            {/* 🔥 NOME DESTACADO */}
            <span
              style={{
                ...theme.typography.h3,
              }}
            >
              {c.title}
            </span>

            <span>{getDifficultyUI(c.difficulty)}</span>

            <span style={{ color: theme.muted }}>
              {getPercentageByResolutionsPTBR(c.solvedCount, c.attempts)}
            </span>

            <span style={{ color: theme.muted }}>{c.userAttempts ?? '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
