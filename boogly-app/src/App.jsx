
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from 'react-router-dom';

import {
  Suspense,
  lazy,
  useContext,
  useMemo,
} from 'react';

import { useAuth } from './autenticator/useAuth';
import { AppContext } from './app_configuration/AppContext';
import { LoadingPage } from './components/pages/LoadingPage';
import GuidedTourModal from './components/modals/GuideTourModal';

// Lazy loading
const Home = lazy(() =>
  import('./components/pages/HomePage')
);

const MainApp = lazy(() =>
  import('./components/pages/MainApp')
);

const EditorPage = lazy(() =>
  import('./components/pages/EditorPage')
);

const ChallengePage = lazy(() =>
  import('./components/challenge/ChallengePage')
);

const ChallengeDetail = lazy(() =>
  import('./components/challenge/ChallengeDetail')
);

const ChallengePlay = lazy(() =>
  import('./components/challenge/ChallengePlay')
);

// Proteção das rotas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth, structure } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!structure) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout de carregamento
function LazyPage({ children }) {
  return (
    <Suspense fallback={<LoadingPage />}>
      {children}
    </Suspense>
  );
}

export default function AppRouter() {
  const { mainRoute } = useContext(AppContext);

  const router = useMemo(() => {
    if (!mainRoute) return null;

    return createBrowserRouter([
      {
        path: '/',
        element: (
          <LazyPage>
            <Home />
          </LazyPage>
        ),
      },
      {
        path: mainRoute,
        element: (
          <ProtectedRoute>
            <LazyPage>
              <MainApp />
            </LazyPage>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <LazyPage>
                <EditorPage />
                <GuidedTourModal />
              </LazyPage>
            ),
          },
          {
            path: 'challenges',
            element: (
              <LazyPage>
                <ChallengePage />
              </LazyPage>
            ),
          },
          {
            path: 'challenges/:id',
            element: (
              <LazyPage>
                <ChallengeDetail />
              </LazyPage>
            ),
          },
          {
            path: 'challenges/:id/play',
            element: (
              <LazyPage>
                <ChallengePlay />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ]);
  }, [mainRoute]);

  if (!router) {
    return <LoadingPage />;
  }

  return <RouterProvider router={router} />;
}
