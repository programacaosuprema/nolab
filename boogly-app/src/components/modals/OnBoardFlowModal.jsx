// src/components/onboarding/OnboardingFlow.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { AppContext } from '../../app_configuration/AppContext';
import { useAuth } from '../../autenticator/useAuth';
import { useTheme } from '../../theme/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { updateOnboarding } from '../../services/userService';

const steps = [
  {
    title: 'Bem-vindo 👋',
    description: 'Você vai aprender estruturas de dados de forma visual.',
  },
  {
    title: 'Arraste blocos 🧩',
    description: 'Monte algoritmos conectando blocos.',
  },
  { title: 'Execute ▶️', description: 'Teste sua solução em tempo real.' },
  { title: 'Evolua 🚀', description: 'Resolva desafios e evolua.' },
];

export default function OnboardingFlowModal({ onFinish }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(() => {
    // inicializa do localStorage / sessionStorage (prioriza localStorage)
    try {
      const ls = localStorage.getItem('onboarding_done');
      if (ls === 'true') return true;
      const ss = sessionStorage.getItem('onboarding_done');
      return ss === 'true';
    } catch (e) {
      return false;
    }
  });

  const { domainUrl } = useContext(AppContext);
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const nextButtonRef = useRef(null);

  const current = steps[step];

  useEffect(() => {
    // trava scroll da página enquanto o modal estiver aberto
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || 'auto';
    };
  }, []);

  useEffect(() => {
    // foca o botão próximo para navegação por teclado
    if (nextButtonRef.current) nextButtonRef.current.focus();
  }, [step]);

  const finish = useCallback(async () => {
    try {
      // 👻 GUEST (local/session)
      try {
        if (dontShow) {
          sessionStorage.setItem('onboarding_done', 'true');
          localStorage.setItem('onboarding_done', 'true');
        } else {
          sessionStorage.removeItem('onboarding_done');
          localStorage.removeItem('onboarding_done');
        }
      } catch (e) {
        console.warn('Storage write failed:', e);
      }

      // 👤 USUÁRIO LOGADO
      if (user && !user?.guest) {
        await updateOnboarding({
          domainUrl,
          onboardingDone: !!dontShow,
        });

        // 🔥 atualiza contexto
        await refreshUser();
      }

      onFinish?.();
    } catch (err) {
      console.error('Erro onboarding:', err);

      try {
        await refreshUser();
      } catch (e) {}

      onFinish?.();
    }
  }, [dontShow, user, domainUrl, onFinish, refreshUser]);

  function next() {
    if (step === steps.length - 1) finish();
    else setStep((s) => s + 1);
  }

  function skip() {
    finish();
  }

  // hover states apenas para micro-interações
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  // animação dos cards
  const variants = {
    enter: { opacity: 0, y: 10 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-title"
      style={{
        background: 'rgba(0,0,0,0.7)',
        padding: theme?.spacing?.lg || '24px',
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl text-center"
        style={{
          background: theme?.panel,
          color: theme?.text,
          padding: theme?.spacing?.lg || '24px',
          boxSizing: 'border-box',
          border: `1px solid ${theme?.border}`,
          borderRadius: 24,
        }}
      >
        {/* PROGRESS DOTS */}
        <div className="flex justify-center gap-2 mb-6" aria-hidden>
          {steps.map((_, i) => (
            <div
              key={i}
              role="button"
              tabIndex={-1}
              aria-current={i === step ? 'step' : undefined}
              className="w-3 h-3 rounded-full transition"
              style={{
                width: 10,
                height: 10,
                background: i === step ? theme?.primary : theme?.card,
                opacity: i === step ? 1 : 0.45,
                border: `1px solid ${theme?.border}`,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>

        {/* CONTENT (animated) */}
        <div style={{ minHeight: 120 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
            >
              <h2
                id="onboarding-title"
                className="text-2xl font-bold mb-3"
                style={{
                  margin: 0,
                  ...theme?.typography?.h2,
                  color: theme?.text,
                }}
              >
                {current.title}
              </h2>

              <p
                className="mb-4"
                style={{
                  margin: 0,
                  color: theme?.muted,
                  ...theme?.typography?.body,
                }}
              >
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CHECKBOX */}
        <label
          className="flex items-center justify-center gap-2 mb-6 text-sm"
          style={{ color: theme?.muted, ...theme?.typography?.small }}
        >
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            aria-checked={dontShow}
          />
          Não mostrar novamente
        </label>

        {/* ACTIONS */}
        <div
          className="flex justify-between items-center"
          style={{ gap: theme?.spacing?.md }}
        >
          <button
            onClick={skip}
            onMouseEnter={() => setHoverPrev(true)}
            onMouseLeave={() => setHoverPrev(false)}
            className="underline text-sm"
            style={{
              background: 'transparent',
              border: 'none',
              padding: theme?.spacing?.sm,
              color: hoverPrev ? theme?.text : theme?.muted,
              cursor: 'pointer',
            }}
            aria-label="Pular onboarding"
          >
            pular
          </button>

          <button
            ref={nextButtonRef}
            onClick={next}
            onMouseEnter={() => setHoverNext(true)}
            onMouseLeave={() => setHoverNext(false)}
            className="px-6 py-2 rounded-lg font-semibold"
            style={{
              background: hoverNext ? theme?.hover : theme?.primary,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              paddingLeft: theme?.spacing?.lg,
              paddingRight: theme?.spacing?.lg,
            }}
            aria-label={step === steps.length - 1 ? 'Começar' : 'Próximo'}
          >
            {step === steps.length - 1 ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
