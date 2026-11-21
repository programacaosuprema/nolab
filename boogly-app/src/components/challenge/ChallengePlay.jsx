import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { AppContext } from '../../app_configuration/AppContext';
import { useTheme } from '../../theme/useTheme';
import { useError } from '../../error/hooks/useError';
import { normalizeError } from '../../error/utils/normalizeError';
import ChallengeBlocklyEditor from '../challenge/ChallengeBlocklyEditor';
import ChallengeResult from '../challenge/ChallengeResult';
import { challengeToolbox } from '../../blockly/index';
import ExpireModal from '../modals/ExpireModal'; // novo
import useCountdown from '../../hooks/useCountDown'; // seu hook (ajustado)
import ChallengeTimer from '../challenge/ChallengeTimer';
import {submitChallenge, getChallenge, abandonChallenge, expireChallenge} from '../../services/challengeService';
import { LogOut } from 'lucide-react';
import ChallengeExitModal from '../modals/ChallengeExitModal';
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
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const allowExitRef = useRef(false);

  // Intercepta navegações internas do React Router
  //Bloquear botão voltar do navegador
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowExitRef.current &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const expireSentRef = useRef(false);

  async function handleExpire() {
    // Impede chamadas duplicadas nesta montagem
    if (expireSentRef.current) return;

    expireSentRef.current = true;

    try {
      const data = await expireChallenge({
        domainUrl,
        id,
      });

      // Atualiza o progresso do aluno
      applyAttemptUpdate(data.userAttempt);

      // Abre o modal de tempo esgotado
      setExpireModalOpen(true);
    } catch (error) {
      expireSentRef.current = false;
      showError(normalizeError(error));
    }
  }

  // Abre o modal quando uma navegação é bloqueada
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setExitModalOpen(true);
    }
  }, [blocker.state]);

  const countdown = useCountdown({
    totalSeconds: totalTime,
    enabled: false,
    keyId: countdownKey,
    onExpire: handleExpire,
    warningThresholds: {
      first: 60,
      last: 10,
    },
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
        userStartedAt: attempt.startedAt ?? prev.userStartedAt,
        userCompletedAt: attempt.completedAt ?? prev.userCompletedAt,
      };
    });
  }

  useEffect(() => {
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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

        setUserAttempt({
          status: data.userStatus ?? 'pending',
          attempts: data.userAttempts ?? 0,
          startedAt: data.userStartedAt ?? null,
          completedAt: data.userCompletedAt ?? null,
        });
      } catch (err) {
        showError(normalizeError(err));
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
    if (running) return;

    try {
      setRunning(true);

      const data = await submitChallenge({
        domainUrl,
        id,
        commands,
      });

      console.log('Resposta do backend:', data);
      console.log('Tentativas no MongoDB:', data.userAttempt?.attempts);

      // Contador local de execuções nesta sessão
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Tempo utilizado no desafio
      const timeSpent = Math.max(0, totalTime - secondsLeft);

      setResult({
        success: !!data.success,
        message: data.message || (data.success ? 'Correto 🎉' : 'Incorreto'),
        output: data.output ?? [],
        expected: data.expected ?? null,
        steps: data.steps ?? [],
        timeSpent,
        attempts: data.userAttempt?.attempts ?? newAttempts,
      });

      // Atualiza status, tentativas e datas do usuário
      applyAttemptUpdate(data.userAttempt);

      // Se acertou, encerra o cronômetro
      if (data.success) {
        reset();
      }
    } catch (err) {
      showError(normalizeError(err));
    } finally {
      setRunning(false);
    }
  }

  function handleRetry() {
    expireSentRef.current = false;

    setExpireModalOpen(false);
    setResult(null);

    reset();

    start(
      isDevTest
        ? defaultTimeSec
        : Number(challenge?.timeLimit) || defaultTimeSec
    );
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

  function handleRequestExit() {
    setExitModalOpen(true);
  }

  function handleCancelExit() {
    setExitModalOpen(false);

    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }

  async function handleConfirmExit() {
    if (leaving) return;

    try {
      setLeaving(true);

      // Registra a desistência no MongoDB
      const data = await abandonChallenge({
        domainUrl,
        id,
      });

      applyAttemptUpdate(data.userAttempt);

      // Libera a navegação
      allowExitRef.current = true;

      setExitModalOpen(false);

      // Se o aluno usou o botão Voltar do navegador
      if (blocker.state === 'blocked') {
        blocker.proceed();
        return;
      }

      // Se o aluno usou o botão Sair do desafio
      navigate(-1);
    } catch (error) {
      showError(normalizeError(error));
    } finally {
      setLeaving(false);
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

            <button
              type="button"
              onClick={handleRequestExit}
              className="flex items-center gap-2 rounded-lg px-4 py-2 transition-opacity hover:opacity-80"
              style={{
                background: theme.card,
                color: theme.warning,
                border: `1px solid ${theme.warning}`,
                ...theme.typography.small,
              }}
            >
              <LogOut size={18} />
              Sair do desafio
            </button>
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

      <ChallengeExitModal
        isOpen={exitModalOpen}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
      />

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
