import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../app_configuration/AppContext';
import { useTheme } from '../../theme/useTheme';
import { useError } from '../../error/useError';
import ChallengeBlocklyEditor from '../challenge/ChallengeBlocklyEditor';
import ChallengeResult from '../challenge/ChallengeResult';
import { challengeToolbox } from '../../blockly/index';
import ExpireModal from '../modals/ExpireModal'; // novo
import useCountdown from '../../hooks/useCountdown'; // seu hook (ajustado)
import ChallengeTimer from '../challenge/ChallengeTimer';
import {
  createAttempt,
  submitChallenge,
  getChallenge,
} from '../../services/challengeService';
import { LoadingPage } from '../pages/LoadingPage';

export default function ChallengePlay() {
  const isDevTest = false; //para testar algumas coisas. É verdadeiro enquanto for teste
  const { id } = useParams();
  const defaultTimeSec = 10;
  const navigate = useNavigate();
  const { domainUrl } = useContext(AppContext);
  const { theme } = useTheme();
  const { showError } = useError();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAttempt, setUserAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [expireModalOpen, setExpireModalOpen] = useState(false);
  const countdownKey = `challenge_${id}_end`;
  const totalTime = Number(challenge?.timeLimit) || defaultTimeSec;
  const startedRef = useRef(false);
  const [attempts, setAttempts] = useState(0);

  const countdown = useCountdown({
    totalSeconds: totalTime,
    enabled: false,
    keyId: countdownKey,
    onExpire: () => {
      // Quando expirar, abrimos modal (não redirecionamos)
      setExpireModalOpen(true);
    },
    warningThresholds: { first: 60, last: 10 },
  });

  const { secondsLeft, percent, warningFirst, warningLast, start, reset } =
    countdown;

  function applyAttemptUpdate(attempt) {
    if (!attempt) return;

    setUserAttempt(attempt);

    setChallenge((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        userStatus: attempt.status ?? prev.userStatus,
        userAttempts: attempt.attempts ?? prev.userAttempts,
      };
    });
  }

  useEffect(() => {
    if (!challenge) return;
    if (startedRef.current) return;

    startedRef.current = true;

    const stored = sessionStorage.getItem(countdownKey);

    if (stored) {
      start();
    } else {
      const seconds = Number(challenge.timeLimit) || defaultTimeSec;

      start(isDevTest ? defaultTimeSec : seconds);
    }
  }, [challenge, countdownKey, isDevTest, start]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getChallenge({ domainUrl, id });

        setChallenge(data);
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    }

    if (id && domainUrl) {
      load();
    }
  }, [domainUrl, id, showError]);

  useEffect(() => {
    return () => {
      // cleanup quando sair da página
      sessionStorage.removeItem(countdownKey);
    };
  }, [countdownKey, id]);

  async function handleRun(commands) {
    try {
      setRunning(true);

      let newAttempts;
      setAttempts((prev) => {
        newAttempts = prev + 1;
        return newAttempts;
      });

      const data = await submitChallenge({ domainUrl, id, commands });

      //  tempo gasto baseado no countdown
      const timeSpent = challenge.timeLimit - secondsLeft;

      setResult({
        success: !!data.success,
        message: data.message || (data.success ? 'Correto 🎉' : 'Incorreto'),
        output: data.output ?? [],
        expected: data.expected ?? null,
        steps: data.steps || [],
        timeSpent,
        attempts: newAttempts,
      });

      //  se acertou → reseta countdown
      if (data.success) {
        reset(); // vem do countdown
      }

      applyAttemptUpdate(data.userAttempt);
    } catch (err) {
      showError({ message: err.message });
    } finally {
      setRunning(false);
    }
  }

  async function handleRetry() {
    try {
      // cria nova tentativa no backend
      const newAttempt = await createAttempt({ domainUrl, id });

      applyAttemptUpdate(newAttempt);
    } catch (err) {
      console.error('Erro ao criar nova tentativa:', err);
    }

    //  FECHA MODAL
    setExpireModalOpen(false);

    //  LIMPA ESTADO DO DESAFIO
    setResult(null);

    //  RESETA TIMER
    reset();

    //  INICIA NOVO TEMPO
    const seconds =
      (challenge?.timeLimit && Number(challenge.timeLimit)) || defaultTimeSec;

    start(isDevTest ? defaultTimeSec : seconds);
  }

  function handleBackToChallenges() {
    reset();
    navigate(-2, { replace: true });
  }

  // quando o componente desmonta / resultado aparece — garantir reset do timer
  useEffect(() => {
    return () => {
      reset();
      sessionStorage.removeItem(countdownKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownKey]);

  if (loading) return <LoadingPage />;
  if (!challenge)
    return (
      <div style={{ padding: theme.spacing.lg, ...theme.typography.text }}>
        Desafio não encontrado
      </div>
    );

  const chosenToolbox =
    (challengeToolbox && challengeToolbox[challenge.structure]) ||
    challengeToolbox?.list;

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: theme.background,
        color: theme.text,
        padding: theme.spacing.lg,
      }}
    >
      <div className="h-full flex gap-4 min-h-0">
        {/* LEFT: descrição / regras como antes */}
        <aside
          className="w-96 flex flex-col overflow-auto"
          style={{
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: theme.spacing.md,
          }}
        >
          <h2
            style={{
              ...theme.typography.title,
              color: theme.primary,
              marginBottom: theme.spacing.sm,
            }}
          >
            {challenge.title}
          </h2>

          {/* Descrição resumida e exemplo */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <div style={{ ...theme.typography.small, color: theme.muted }}>
              Instruções
            </div>

            <div
              style={{
                marginTop: theme.spacing.xs,
                padding: theme.spacing.sm,
                borderRadius: '8px',
                background: theme.workspace,
                ...theme.typography.text,
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: challenge.description || '<em>Sem descrição</em>',
                }}
              />
            </div>
          </div>

          {challenge.testCases?.length > 0 && (
            <div style={{ marginBottom: theme.spacing.md }}>
              <div style={{ ...theme.typography.small, color: theme.muted }}>
                Exemplo
              </div>

              <div style={{ marginTop: theme.spacing.sm }}>
                <strong>Entrada:</strong>
                <div
                  style={{
                    marginTop: theme.spacing.xs,
                    padding: theme.spacing.sm,
                    borderRadius: '6px',
                    background: theme.card,
                    ...theme.typography.small,
                  }}
                >
                  {JSON.stringify(challenge.testCases[0].input)}
                </div>

                <strong>Saída:</strong>
                <div
                  style={{
                    marginTop: theme.spacing.xs,
                    padding: theme.spacing.sm,
                    borderRadius: '6px',
                    background: theme.card,
                    ...theme.typography.small,
                  }}
                >
                  {JSON.stringify(challenge.testCases[0].expectedOutput)}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto' }}>
            <div style={{ ...theme.typography.small, color: theme.muted }}>
              Regras
            </div>

            <div style={{ marginTop: theme.spacing.sm }}>
              {(challenge.rules || []).map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                    ...theme.typography.small,
                  }}
                >
                  <span style={{ color: theme.success }}>✔</span>
                  <span>{r.description}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT: editor + timer */}
        <main className="flex-1 flex flex-col min-h-0">
          <div
            style={{
              padding: theme.spacing.md,
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* mostramos o timer no topo — usando o seu visual bonito */}
            <div>
              <ChallengeTimer
                secondsLeft={secondsLeft}
                totalSeconds={challenge.timeLimit || defaultTimeSec}
                percent={percent}
                warningFirst={warningFirst}
                warningLast={warningLast}
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-hidden"
            style={{ background: theme.workspace, borderRadius: '12px' }}
          >
            <ChallengeBlocklyEditor
              toolbox={chosenToolbox}
              structure={challenge.structure}
              setBlockCount={() => {}}
              onRun={handleRun}
            />
          </div>

          <ChallengeResult result={result} onClose={() => setResult(null)} />
        </main>
      </div>

      {/* Expire modal */}
      <ExpireModal
        isOpen={expireModalOpen}
        onClose={() => setExpireModalOpen(false)}
        onRetry={handleRetry}
        onGoBack={handleBackToChallenges}
      />
    </div>
  );
}
