import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../app_configuration/AppContext";
import { useTheme } from "../../theme/useTheme";
import { useError } from "../../error/useError";
import { useAuth } from "../../autenticator/useAuth";
import ChallengeBlocklyEditor from "../challenge/ChallengeBlocklyEditor";
import ChallengeResult from "../challenge/ChallengeResult";
import { challengeToolbox } from "../../blockly/index";
import ExpireModal from "../modals/ExpireModal";               // novo
import useCountdown from "../../hooks/useCountdown";           // seu hook (ajustado)
import ChallengeTimer from "../challenge/ChallengeTimer"; 

export default function ChallengePlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { domainUrl } = useContext(AppContext);
  const { theme } = useTheme();
  const { showError } = useError();
  const { token } = useAuth() || {};

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [userAttempt, setUserAttempt] = useState(null);

  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  // Modal estado
  const [expireModalOpen, setExpireModalOpen] = useState(false);

  const countdownKey = `challenge_${id}_end`;
  const totalTime = Number(challenge?.timeLimit) || 10;
  const countdown = useCountdown({
    totalSeconds: totalTime, 
    enabled: false,
    keyId: countdownKey,
    onExpire: () => {
      // Quando expirar, abrimos modal (não redirecionamos)
      setExpireModalOpen(true);
    },
    warningThresholds: { first: 60, last: 10 }
  });

  const { secondsLeft, percent, warningFirst, warningLast, start, reset } = countdown;
  const startedRef = useRef(false);
  
 useEffect(() => {
  if (!challenge) return;

  if (startedRef.current) return; // 🚫 evita reiniciar

  startedRef.current = true;

  const seconds = Number(challenge.timeLimit) || 10;

  console.log("START TIMER:", seconds);

  start(seconds);
  setStarted(true);

}, [challenge, start]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${domainUrl}/challenges/${id}`, {
          method: "GET",
          credentials: "include",
          headers 
        });
        if (!res.ok) throw new Error("Erro ao carregar desafio");

        const data = await res.json();

        const normalized = {
          ...data,
          structure: data.structure || "list",
          userStatus: data.userStatus || "pending",
          userAttempts: data.userAttempts ?? 0
        };

        setChallenge(normalized);
      } catch (err) {
        showError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [domainUrl, id, showError, token]);

  useEffect(() => {
    return () => {
      // cleanup quando sair da página
      sessionStorage.removeItem(countdownKey);
    };
  }, [countdownKey, id]);

  // Submissão do código (mantive sua lógica)
  async function handleRun(commands) {
    try {
      setRunning(true);

      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${domainUrl}/challenges/${id}/submit`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ commands })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || `Erro ao submeter`);
      }

      const data = await res.json();

      setResult({
        success: !!data.success,
        message: data.message || (data.success ? "Correto 🎉" : "Incorreto"),
        output: data.output ?? [],
        expected: data.expected ?? null,
        steps: data.steps || []
      });

      // parar/resetar o timer quando submeter
      reset();

      if (data.userAttempt) {
        setUserAttempt(data.userAttempt);

        setChallenge((prev) =>
          prev
            ? {
                ...prev,
                userStatus: data.userAttempt.status,
                userAttempts: data.userAttempt.attempts
              }
            : prev
        );
      }
    } catch (err) {
      showError({ message: err.message });
    } finally {
      setRunning(false);
    }
  }

  // Ações do ExpireModal:
  function handleRetry() {
    // fecha modal, reset timer e reinicia o editor
    setExpireModalOpen(false);
    setResult(null);

    // remonta editor reiniciando started (isso depende do seu editor: remontar força estado limpo)
    setStarted(false);
    // pequeno delay para remount
    setTimeout(() => {
      setStarted(true);
      const seconds = (challenge?.timeLimit && Number(challenge.timeLimit)) || timeDefault;
      start(seconds);
    }, 80);
  }

  function handleBackToChallenges() {
    reset(); // 🔥 importante
    sessionStorage.removeItem(countdownKey);

    setStarted(false);
    setResult(null);
    setUserAttempt(null);
    setExpireModalOpen(false);

    navigate(-1, { replace: true });
  }

  // quando o componente desmonta / resultado aparece — garantir reset do timer
  useEffect(() => {
    return () => {
      reset();
      sessionStorage.removeItem(countdownKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownKey]);

  if (loading) return <div style={{ padding: theme.spacing.lg, ...theme.typography.text }}>Carregando...</div>;
  if (!challenge) return <div style={{ padding: theme.spacing.lg, ...theme.typography.text }}>Desafio não encontrado</div>;

  const chosenToolbox = (challengeToolbox && challengeToolbox[challenge.structure]) || challengeToolbox?.list;

  return (
    <div className="h-full flex flex-col" style={{ background: theme.background, color: theme.text, padding: theme.spacing.lg }}>
        <div className="h-full flex gap-4 min-h-0">
          {/* LEFT: descrição / regras como antes */}
          <aside
            className="w-96 flex flex-col overflow-auto"
            style={{
              background: theme.panel,
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              padding: theme.spacing.md
            }}
          >
            <h2
              style={{
                ...theme.typography.title,
                color: theme.primary,
                marginBottom: theme.spacing.sm
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
                  borderRadius: "8px",
                  background: theme.workspace,
                  ...theme.typography.text
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: challenge.description || "<em>Sem descrição</em>"
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
                      borderRadius: "6px",
                      background: theme.card,
                      ...theme.typography.small
                    }}
                  >
                    {JSON.stringify(challenge.testCases[0].input)}
                  </div>

                  <strong>Saída:</strong>
                  <div
                    style={{
                      marginTop: theme.spacing.xs,
                      padding: theme.spacing.sm,
                      borderRadius: "6px",
                      background: theme.card,
                      ...theme.typography.small
                    }}
                  >
                    {JSON.stringify(challenge.testCases[0].expectedOutput)}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "auto" }}>
              <div style={{ ...theme.typography.small, color: theme.muted }}>
                Regras
              </div>

              <div style={{ marginTop: theme.spacing.sm }}>
                {(challenge.rules || []).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: theme.spacing.sm,
                      ...theme.typography.small
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
            <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* mostramos o timer no topo — usando o seu visual bonito */}
              <div>
                <ChallengeTimer
                  secondsLeft={secondsLeft}
                  totalSeconds={challenge.timeLimit || timeDefault}
                  percent={percent}
                  warningFirst={warningFirst}
                  warningLast={warningLast}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden" style={{ background: theme.workspace, borderRadius: "12px" }}>
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