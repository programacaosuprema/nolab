import { useContext } from 'react';
import { ErrorContext } from './ErrorContext';

export function useError() {
  return useContext(ErrorContext);
}
