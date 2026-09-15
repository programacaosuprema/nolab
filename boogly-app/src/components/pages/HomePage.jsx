// src/pages/Home.jsx
import { useState, useContext, useEffect } from "react";
import AuthModal from "../modals/AuthModal";
import OnboardingModal from "../modals/OnBoardFlowModal";

import { useAuth } from "../../autenticator/useAuth";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../app_configuration/useApp";
import { useError } from "../../error/useError";
import { homeTheme } from "../../theme/HomeTheme";
import { AppContext } from "../../app_configuration/AppContext";
import { useTheme } from "../../theme/useTheme";
import { checkOnboarding } from "../../services/userService";

export default function Home() {
  const { user, loginAsGuest, setStructure } = useAuth();
  const { showError } = useError();
  const { domainUrl, mainRoute } = useContext(AppContext);
  const [openModal, setOpenModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const navigate = useNavigate();
  const { appName } = useApp();
  const { theme } = useTheme();

  // --- Restore structure from localStorage on mount (so /app knows what to show after reload)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("structure");
      if (saved && setStructure) {
        setStructure(saved);
      }
    } catch (e) {
      console.warn("Não foi possível ler structure do localStorage:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // centraliza a lógica de persistência (use quando o aluno escolhe)
  function persistAndSetStructure(type) {
    try {
      if (setStructure) setStructure(type);
      localStorage.setItem("structure", type);
    } catch (e) {
      console.warn("Erro ao persistir structure:", e);
    }
  }


  async function handleStart(type) {
    if (!type) {
      showError({ message: "Estrutura inválida" });
      return;
    }

    persistAndSetStructure(type);
    setSelectedStructure(type);

    // 🚫 não logado
    if (!user) {
      setOpenModal(true);
      return;
    }

    // 👻 guest
    if (user.guest) {
      const done = sessionStorage.getItem("onboarding_done") || localStorage.getItem("onboarding_done");

      if (done === "true") {
        navigate(mainRoute);
      } else {
        setShowOnboarding(true);
      }
      return;
    }

    // 👤 usuário real
    try {
      const data = await checkOnboarding({ domainUrl });

      if (data.onboardingDone) {
        navigate(mainRoute);
      } else {
        setShowOnboarding(true);
      }

    } catch (err) {
      console.error("Erro ao verificar onboarding:", err);
      setShowOnboarding(true);
    }
  }

  // final do onboarding — garante persistência e navegação
  function finishOnboarding() {
    if (!selectedStructure) {
      showError({ message: "Erro ao iniciar o desafio" });
      return;
    }

    try {
      persistAndSetStructure(selectedStructure);
      setShowOnboarding(false);
      navigate(mainRoute);
    } catch (err) {
      showError(err);
    }
  }

  // login como convidado
  async function handleGuest() {
    try {
      setLoadingGuest(true);
      await loginAsGuest();
    } catch (err) {
      showError(err);
    } finally {
      setLoadingGuest(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: theme?.background,
        color: theme?.text,
        fontFamily: theme?.typography?.body?.fontFamily || undefined
      }}
    >
      {/* container central */}
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: theme?.spacing?.lg,
          padding: theme?.spacing?.lg,
          borderRadius: 16,
          boxSizing: "border-box"
        }}
      >
        {/* TITLE */}
        <h1
          className="text-center"
          style={{
            margin: 0,
            color: theme?.text,
            ...theme?.typography?.h1,
            fontSize: "48px",
            lineHeight: 1
          }}
        >
          {appName}
        </h1>

        <p
          className="text-center"
          style={{
            color: theme?.muted,
            ...theme?.typography?.body,
            margin: 0
          }}
        >
          Escolha seu primeiro desafio!
        </p>

        {/* CARDS */}
        <div
          className="flex flex-wrap justify-center gap-8"
          style={{ width: "100%", marginTop: theme?.spacing?.md }}
        >
          <HomeCard
            title="Lista"
            description="Aprenda como funciona uma lista (inserção, remoção, travessia)."
            gradient={homeTheme.list?.gradient}
            onClick={() => handleStart("list")}
            theme={theme}
          />

          <HomeCard
            title="Pilha"
            description="Entenda PUSH e POP: funcionamento LIFO."
            gradient={homeTheme.stack?.gradient}
            onClick={() => handleStart("stack")}
            theme={theme}
          />

          <HomeCard
            title="Fila"
            description="FIFO — enfileire e desenfileire elementos com operações simples."
            gradient={homeTheme.queue?.gradient}
            onClick={() => handleStart("queue")}
            theme={theme}
          />

          {/* Em breve: Árvore Binária */}
          <HomeCard
            title="Árvore Binária"
            description="Explorar travessia e inserção em árvore binária — Em breve."
            gradient={homeTheme.tree?.gradient}
            onClick={() => {}}
            disabled={true}
            theme={theme}
          />
        </div>

        {/* ACTIONS */}
        <div
          className="mt-6 flex flex-col items-center gap-4"
          style={{ width: "100%", alignItems: "center" }}
        >
          {!user ? (
            <>
              <PrimaryButton onClick={() => setOpenModal(true)} text="Entrar / Criar Conta" theme={theme} />
              <GhostButton onClick={handleGuest} loading={loadingGuest} text={loadingGuest ? "Entrando..." : "Testar sem login"} theme={theme} />
            </>
          ) : null}

          <p className="text-sm" style={{ color: theme?.muted, marginTop: theme?.spacing?.sm }}>
            {!user
              ? "O progresso não será salvo sem login"
              : user.guest
              ? "Modo visitante ativo. Escolha uma estrutura de dados para começar."
              : `Bem-vindo, ${user.nickname}! Escolha uma estrutura de dados para estudar.`}
          </p>
        </div>

        {/* AUTH MODAL / ONBOARDING */}
        <AuthModal isOpen={openModal} onClose={() => setOpenModal(false)} />
        {showOnboarding && <OnboardingModal onFinish={finishOnboarding} />}
      </div>
    </div>
  );
}

/* ======= COMPONENTS AUXILIARES ======= */
function HomeCard({ title, description, gradient, onClick, disabled = false, theme }) {
  const [hover, setHover] = useState(false);

  // overlay para melhorar contraste quando gradient é usado
  const overlayDark = "rgba(0,0,0,0.36)";
  const overlayLight = "rgba(255,255,255,0.06)";

  const background = gradient || theme?.card || "#ffffff";

  const cardStyle = {
    background,
    width: 256,
    padding: 20,
    borderRadius: 20,
    boxShadow: hover ? "0 14px 40px rgba(2,6,23,0.12)" : "0 8px 20px rgba(2,6,23,0.06)",
    transform: hover ? "translateY(-6px) scale(1.03)" : "translateY(0) scale(1)",
    transition: "all 180ms ease",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
    minHeight: 160,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden"
  };

  // decide overlay com base no tema de fundo
  const overlayColor = theme?.name?.toLowerCase?.() === "escuro" ? overlayDark : overlayLight;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      aria-disabled={disabled}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) onClick && onClick();
      }}
      className="w-64 p-5 rounded-2xl shadow-xl transition"
      style={cardStyle}
    >
      {/* overlay para legibilidade (apenas se tiver gradiente) */}
      {gradient && <div style={{ position: "absolute", inset: 0, background: overlayColor, pointerEvents: "none" }} />}

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ margin: 0, color: theme?.text, ...theme?.typography?.h2 }}>{title}</h2>
        <p style={{ marginTop: 8, marginBottom: 0, color: theme?.muted, ...theme?.typography?.body }}>{description}</p>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <button
          className="w-full py-2 rounded-lg font-semibold"
          style={{
            background: disabled ? theme?.border : "#4ade80",
            color: "#000",
            border: `1px solid ${theme?.border}`
          }}
          disabled={disabled}
          aria-label={`Iniciar ${title}`}
        >
          {disabled ? "Em breve" : "Iniciar"}
        </button>
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, text, theme }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={text}
      className="px-6 py-2 rounded-lg font-semibold transition"
      style={{
        background: hover ? (theme?.hover || theme?.primary) : theme?.primary,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: hover ? `0 10px 30px ${theme?.primary}22` : "none"
      }}
    >
      {text}
    </button>
  );
}

function GhostButton({ onClick, text, loading = false, theme }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      aria-label={text}
      className="px-6 py-2 rounded-lg transition"
      style={{
        background: hover ? (theme?.active || theme?.card) : theme?.card,
        color: theme?.text,
        border: `1px solid ${theme?.border}`,
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "not-allowed" : "pointer"
      }}
    >
      {text}
    </button>
  );
}