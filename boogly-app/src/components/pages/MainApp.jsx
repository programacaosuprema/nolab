import { Outlet } from 'react-router-dom';
import Header from '../panels/HeaderPanel';
import { useAuth } from '../../autenticator/useAuth';
import { useTheme } from '../../theme/useTheme';

export default function MainApp() {
  const { structure, setStructure } = useAuth();
  const { theme } = useTheme();

  return (
    <div
      className="h-dvh flex flex-col"
      style={{
        background: theme.background,
        color: theme.text,
      }}
    >
      {/* HEADER */}
      <header
        className="h-16 shrink-0 border-b"
        style={{
          borderColor: theme.border,
          background: theme.header,
        }}
      >
        <Header structure={structure} setStructure={setStructure} />
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div
          className="h-full p-3"
          style={{
            background: theme.background,
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
