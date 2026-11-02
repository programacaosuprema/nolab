
import { useState } from 'react';
import { useApp } from '../../app_configuration/useApp';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../autenticator/useAuth';
import { useTheme } from '../../theme/useTheme';
import ActionButton from '../../components/ui/ActionButton';
import { LogOut, Target, User } from 'lucide-react';
import StudentProfileModal from '../modals/StudentProfileModal';

const STRUCTURE_LABELS = {
  list: 'Lista',
  stack: 'Pilha',
  queue: 'Fila',
};

export default function Header({ structure }) {
  const { theme, themeName = 'dark', setThemeName } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { appName, mainRoute } = useApp();
  const location = useLocation();

  const mode = STRUCTURE_LABELS[structure] || 'Lista';

  const isChallengePage = location.pathname.startsWith(
    `${mainRoute}/challenges`
  );

  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      throw new Error(`Erro ao sair: ${err.message}`);
    }
  }

  // Cores do seletor de acordo com o tema atual.
  const selectStyle = {
    backgroundColor: theme.toolbox,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    colorScheme: themeName === 'light' ? 'light' : 'dark',
  };

  const optionStyle = {
    backgroundColor: theme.card,
    color: theme.text,
  };

  return (
    <div
      className="w-full h-full flex items-center justify-between px-6"
      style={{
        background: theme.background,
        color: theme.text,
      }}
    >
      {/*NOME */}

      <div
        key={theme.name}
        style={{
          fontSize: '30px',
          fontWeight: 800,
          letterSpacing: '1.5px',
          fontFamily: "'Orbitron', sans-serif",
          color: theme.primary,
          textShadow: `0 0 12px ${theme.primary}40`,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {(appName || 'Nó Lab').replace(/\s+/g, '').toUpperCase()}
      </div>


      {/* AÇÕES À DIREITA */}
      <div className="flex items-center gap-3">
        {/* MODO ATUAL */}
        <div
          className="px-4 py-2 rounded-full text-sm"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
          }}
        >
          modo: <span className="font-semibold">{mode}</span>
        </div>

        {/* PERFIL */}
        <ActionButton
          onClick={() => setOpen(true)}
          icon={User}
        >
          {user?.nickname ?? 'Perfil'}
        </ActionButton>

        <StudentProfileModal
          isOpen={open}
          onClose={() => setOpen(false)}
          userProp={user}
        />

        {/* DESAFIOS */}
        {!isChallengePage && (
          <ActionButton
            data-tour="challenges"
            id="nav-challenges"
            className="nav-challenges"
            aria-label={`Ir para desafios ${mode}`}
            onClick={() =>
              navigate(
                `${mainRoute}/challenges?structure=${structure}`
              )
            }
            icon={Target}
          >
            desafios {mode.toLowerCase()}
          </ActionButton>
        )}

        {/* SELETOR DE TEMA */}
        <select
          aria-label="Selecionar tema"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg outline-none cursor-pointer"
          style={selectStyle}
        >
          <option value="light" style={optionStyle}>
            🌞 Claro
          </option>

          <option value="dark" style={optionStyle}>
            🌙 Escuro
          </option>

          <option value="colorful" style={optionStyle}>
            🎨 Colorido
          </option>
        </select>

        {/* SAIR */}
        <ActionButton
          onClick={handleLogout}
          icon={LogOut}
          variant="danger"
        >
          Sair
        </ActionButton>
      </div>
    </div>
  );
}