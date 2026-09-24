import { useContext } from 'react';
import { ErrorContext } from '../context/ErrorContext';

export function useError() {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error('useError deve ser usado dentro do ErrorProvider');
  }

  return context;
}