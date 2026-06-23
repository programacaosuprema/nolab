import { useApp } from "../../app_configuration/useApp";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../autenticator/useAuth";
import { useTheme } from "../../theme/useTheme";
import ActionButton from "../../components/ui/ActionButton";
import { LogOut, Trophy, Target, Star } from "lucide-react";

const STRUCTURE_LABELS = {
  list: "Lista",
  stack: "Pilha",
  queue: "Fila",
};

export default function Header({ structure }) {
  const { theme, themeName = "dark", setThemeName } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { appName } = useApp();
  const location = useLocation();

  const mode = STRUCTURE_LABELS[structure] || "Lista";
  const isChallengePage = location.pathname.startsWith("/app/challenges");

  // 🔒 nickname seguro
  const nickname = user?.nickname
    ? user.nickname.toUpperCase()
    : "VISITANTE";

  const points = user?.points ?? 0;

  async function handleLogout() {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  }

  return (
    <div
      className="w-full h-full flex items-center justify-between px-6"
      style={{
        background: theme.background,
        color: theme.text
      }}
    >

      {/* 🔥 ESQUERDA */}
      <div className="flex items-center gap-3">

        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-md" />

        <h1 className="text-lg font-semibold">
          {(appName || "APP").toUpperCase()}
        </h1>

      </div>

      {/* 🔥 DIREITA */}
      <div className="flex items-center gap-3">

        {/* 👤 USER */}
        <span>
          👤 {nickname}
        </span>

        {/* 🎮 MODO */}
        <div
          className="px-4 py-2 rounded-full text-sm"
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`
          }}
        >
          modo: <span className="font-semibold">{mode}</span>
        </div>

        {
          /*
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`
              }}
            >
              <Star className="w-4 h-4" style={{ color: theme.warning }} />
              {points} pontos
            </div> 
          */
        }

        {/* 🎯 DESAFIOS */}
        {!isChallengePage && (
          <ActionButton
            onClick={() =>
              navigate("/app/challenges", { state: { structure } })
            }
            icon={Target}
          >
            desafios {mode.toLowerCase()}
          </ActionButton>
        )}

        {/*
          <ActionButton
            icon={Trophy}
            onClick={() => navigate("/app/ranking")}
          >
            ranking
          </ActionButton>
        */}

        {/* 🎨 THEME */}
        <select
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          className="text-sm px-3 py-1 rounded-lg outline-none"
          style={{
            background: theme.toolbox,
            color: theme.text,
            border: `1px solid ${theme.border}`
          }}
        >
          <option value="light">🌞 Claro</option>
          <option value="dark">🌙 Escuro</option>
          <option value="colorful">🎨 Colorido</option>
        </select>

        {/* 🚪 LOGOUT */}
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