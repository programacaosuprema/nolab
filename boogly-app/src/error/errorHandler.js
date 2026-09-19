export function normalizeError(error) {
  if (!error) {
    return {
      message: 'Erro desconhecido',
      type: 'unknown',
    };
  }

  // API error
  if (error.response) {
    return {
      message: error.response.data?.message || 'Erro do servidor',
      type: 'api',
      status: error.response.status,
    };
  }

  // Fetch error
  if (error.message?.includes('Failed to fetch')) {
    return {
      message: 'Erro de conexão com o servidor',
      type: 'network',
    };
  }

  return {
    message: error.message || 'Erro inesperado',
    type: 'generic',
  };
}
