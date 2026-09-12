import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";

import { useAuth } from "./autenticator/useAuth";
import { LoadingPage } from "./components/pages/LoadingPage";
import { ErrorPage } from "./components/pages/ErrorPage";
import GuidedTour from "./components/tour/GuideTour"; 

// 🔥 lazy load (performance)
const Home = lazy(() => import("./components/pages/HomePage"));
const MainApp = lazy(() => import("./components/pages/MainApp"));
const EditorPage = lazy(() => import("./components/pages/EditorPage"));

const ChallengePage = lazy(() => import("./components/challenge/ChallengePage"));
const ChallengeDetail = lazy(() =>
  import("./components/challenge/ChallengeDetail").then(module => ({
    default: module.default
  }))
);

const ChallengePlay = lazy(() =>
  import("./components/challenge/ChallengePlay")
);

// 🔒 PROTECTED ROUTE
function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth, structure } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!structure) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 🔥 ERROR FALLBACK
function RouteErrorFallback() {
  return <ErrorPage message="Erro ao carregar a página." />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* APP PROTEGIDO */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainApp />
              <GuidedTour/>
            </ProtectedRoute>
          }
        >

          {/* EDITOR */}
          <Route index element={<EditorPage />} />

          {/* DESAFIOS */}
          <Route path="challenges" element={<ChallengePage />} />

          {/* DETALHE */}
          <Route path="challenges/:id" element={<ChallengeDetail />} />

          {/* EXECUÇÃO DO DESAFIO (NOVO) */}
          <Route path="challenges/:id/play" element={<ChallengePlay />} />

        </Route>

        {/* FALLBACK GLOBAL */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}