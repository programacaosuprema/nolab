import { useTheme } from '../../theme/useTheme';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useError } from '../../error/hooks/useError';
import { normalizeError } from '../../error/utils/normalizeError';

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

function formatValue(value) {
  if (value === null || value === undefined) return 'nulo';

  if (typeof value === 'string') return value;

  //  SE FOR ARRAY → UMA LINHA
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }

  // resto continua igual
  return JSON.stringify(value);
}

export default function ChallengeResult({ result, onClose }) {
  const { showError } = useError();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isSuccess = result?.success;

  //  SEMPRE executa (mesmo se result for null)
  useEffect(() => {
    try{ 
      if (isSuccess) {
        const timer = setTimeout(() => {
          navigate(-2);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }catch(err){
      showError(normalizeError(err));
    }
    
  }, [isSuccess, navigate]);

  //  AGORA pode fazer return
  if (!result) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
      }}
    >
      <div
        className="rounded-xl shadow-xl"
        style={{
          width: '520px',
          padding: theme.spacing.lg,
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* HEADER */}
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: theme.spacing.md }}
        >
          <h2
            style={{
              ...theme.typography.h3,
              color: theme.primary,
            }}
          >
            Resultado da Execução
          </h2>

          <button
            onClick={onClose}
            style={{
              color: theme.muted,
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✖
          </button>
        </div>

        {/* STATUS */}
        <div
          className="flex flex-col gap-1"
          style={{ marginBottom: theme.spacing.md }}
        >
          <span style={{ color: theme.muted }}>
            <strong>{result.message}</strong>
          </span>

          <span style={{ color: theme.muted }}>
            <strong>Tempo gasto:</strong> {formatTime(result.timeSpent)}
          </span>

          <span style={{ color: theme.muted }}>
            <strong>Tentativas:</strong> {result.attempts}
          </span>
        </div>

        {/* RESULTADO FINAL */}
        <div style={{ marginBottom: theme.spacing.md }}>
          <strong>Resultado final:</strong>
          <pre
            style={{
              marginTop: theme.spacing.xs,
              padding: theme.spacing.sm,
              borderRadius: '8px',
              background: theme.background,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontSize: theme.typography.small.fontSize,
            }}
          >
            {formatValue(result.output ?? [])}
          </pre>
        </div>

        {/* ERRO */}
        {!isSuccess && (
          <div style={{ marginBottom: theme.spacing.md }}>
            <div>
              <strong>Esperado:</strong>
              <pre
                style={{
                  marginTop: theme.spacing.xs,
                  padding: theme.spacing.sm,
                  borderRadius: '8px',
                  background: 'rgba(34,197,94,0.1)',
                  color: theme.text,
                }}
              >
                {formatValue(result.expected)}
              </pre>
            </div>

            <div style={{ marginTop: theme.spacing.sm }}>
              <strong>Seu resultado:</strong>
              <pre
                style={{
                  marginTop: theme.spacing.xs,
                  padding: theme.spacing.sm,
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)',
                  color: theme.text,
                }}
              >
                {formatValue(result.output)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
