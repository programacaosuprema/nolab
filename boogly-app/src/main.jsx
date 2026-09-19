import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.jsx';

import { AuthProvider } from './autenticator/AuthProvider';
import { AppProvider } from './app_configuration/AppProvider';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
import { ErrorProvider } from './error/ErrorProvider.jsx';
import ErrorBoundaryWrapper from './error/ErrorBoundaryWrapper';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <ErrorProvider>
        <AppProvider>
          <AuthProvider>
            <ErrorBoundaryWrapper>
              <App />
            </ErrorBoundaryWrapper>
          </AuthProvider>
        </AppProvider>
      </ErrorProvider>
    </ThemeProvider>
  </BrowserRouter>
);
