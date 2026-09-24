import { useError } from '../hooks/useError';

export default function ErrorFallback() {
  const { error, clearError } = useError();

  if (!error) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <h1 className="text-2xl font-bold mb-4">⚠️ Algo deu errado</h1>

      <p className="mb-4 text-gray-600">{error.message}</p>

      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Recarregar
        </button>

        <button
          onClick={clearError}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}