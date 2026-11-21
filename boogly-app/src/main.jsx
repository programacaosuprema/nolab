
import { createRoot } from 'react-dom/client';

import './index.css';

import AppRouter from './App.jsx';

import { AuthProvider } from './autenticator/AuthProvider';
import { AppProvider } from './app_configuration/AppProvider';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { ErrorProvider } from './error/ErrorProvider.jsx';
import ErrorBoundary from './error/components/ErrorBoundary.jsx';
import ErrorFallback from './error/components/ErrorFallback.jsx';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <ErrorProvider>
      <AppProvider>
        <AuthProvider>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AppRouter />
          </ErrorBoundary>
        </AuthProvider>
      </AppProvider>
    </ErrorProvider>
  </ThemeProvider>
);
