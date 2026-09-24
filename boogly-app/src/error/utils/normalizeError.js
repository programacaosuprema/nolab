export function normalizeError(error) {
  if (!error) {
    return {
      message: 'Erro desconhecido',
      type: 'unknown',
    };
  }

  // API (backend respondeu erro)
  if (error.response) {
    return {
      message: error.response.data?.message || 'Erro do servidor',
      type: 'api',
      status: error.response.status,
    };
  }

  // Fetch / network
  if (error.message?.includes('Failed to fetch')) {
    return {
      message: 'Erro de conexão com o servidor',
      type: 'network',
    };
  }

  // Timeout (se usar futuramente)
  if (error.message?.includes('timeout')) {
    return {
      message: 'Tempo de resposta excedido',
      type: 'timeout',
    };
  }

  return {
    message: error.message || 'Erro inesperado',
    type: 'generic',
  };
}