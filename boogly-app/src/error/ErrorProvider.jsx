import { useState } from 'react';
import { ErrorContext } from './ErrorContext.jsx';

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  function showError(err) {
    setError(err);
  }

  function clearError() {
    setError(null);
  }

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}
