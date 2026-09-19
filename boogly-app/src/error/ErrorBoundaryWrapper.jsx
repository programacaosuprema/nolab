import { useError } from './useError';
import ErrorBoundary from './ErrorBoundary';

export default function ErrorBoundaryWrapper({ children }) {
  const { showError } = useError();

  return <ErrorBoundary showError={showError}>{children}</ErrorBoundary>;
}
