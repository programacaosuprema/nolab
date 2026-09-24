export function ErrorPage({ error, message, onRetry }) {
  const finalMessage = message || error?.message || "Erro inesperado";

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-bold">⚠️ Algo deu errado</h1>

      <p className="mt-2 text-gray-500">
        {finalMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}