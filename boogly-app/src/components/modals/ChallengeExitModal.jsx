import { AlertTriangle, LogOut, X } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { playSound } from '../../utils/soundManager';

export default function ChallengeExitModal({ isOpen, onCancel, onConfirm }) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        className="w-full max-w-md rounded-xl shadow-2xl"
        style={{
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          padding: theme.spacing.lg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={26} style={{ color: theme.muted }} />
            <h2
              id="exit-modal-title"
              style={{ ...theme.typography.h3, color: theme.muted }}
            >
              Sair do desafio?
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              onCancel();
              playSound('click');
            }}
            aria-label="Fechar confirmação"
            style={{ color: theme.muted }}
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            ...theme.typography.text,
            color: theme.muted,
            marginBottom: theme.spacing.lg,
          }}
        >
          Tem certeza de que deseja sair deste desafio? Sua solução atual não
          será salva e você precisará recomeçar quando voltar.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onCancel();
            }}
            className="rounded-lg px-4 py-2"
            style={{
              background: theme.card,
              color: theme.text,
              border: `1px solid ${theme.border}`,
            }}
          >
            Continuar desafio
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              onConfirm();
            }}
            className="rounded-lg px-4 py-2 flex items-center gap-2"
            style={{
              background: theme.warning,
              color: '#000',
            }}
          >
            <LogOut size={17} />
            Sim, sair
          </button>
        </div>
      </div>
    </div>
  );
}
