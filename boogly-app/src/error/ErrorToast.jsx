import { useError } from './useError';
import { useTheme } from '../theme/useTheme';

export function ErrorToast() {
  const { error, clearError } = useError();
  const { theme } = useTheme();

  if (!error) return null;

  return (
    <div
      className="fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-50"
      style={{
        background: theme.danger,
        color: '#fff',
      }}
    >
      <div className="flex items-center gap-3">
        <span>⚠️</span>
        <span>{error.message}</span>

        <button onClick={clearError} className="ml-2 text-sm underline">
          fechar
        </button>
      </div>
    </div>
  );
}
