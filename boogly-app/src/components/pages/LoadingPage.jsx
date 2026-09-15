import { useTheme } from "../../theme/useTheme";

const animations = `
@keyframes blockFloat {
  0%   { transform: translateY(0px) rotate(0deg) scale(1); }
  25%  { transform: translateY(-6px) rotate(8deg) scale(1.05); }
  50%  { transform: translateY(0px) rotate(0deg) scale(1); }
  75%  { transform: translateY(6px) rotate(-8deg) scale(1.05); }
  100% { transform: translateY(0px) rotate(0deg) scale(1); }
}

@keyframes blockSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: .45; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.08); }
}

.block-float {
  animation: blockFloat 1.8s ease-in-out infinite;
}

.block-spin {
  animation: blockSpin 2.8s linear infinite;
}

.glow {
  animation: pulseGlow 1.6s ease-in-out infinite;
}
`;

export function LoadingPage() {
  const { theme } = useTheme() || {};

  // 🔒 fallback de segurança
  const safeTheme = theme || {
    background: "#0f172a",
    text: "#fff",
    muted: "#aaa",
    primary: "#3b82f6",
    success: "#22c55e",
    warning: "#fbbf24",
    danger: "#ef4444",
    card: "#1f2937",
    border: "#374151"
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: safeTheme.background,
        color: safeTheme.text
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {/* 🔥 CSS ANIMATION (isolado) */}
      <style>{animations}</style>

      <div className="flex flex-col items-center gap-6">

        {/* 🔵 ANIMAÇÃO */}
        <div className="relative w-40 h-40 flex items-center justify-center">

          {/* glow */}
          <div
            className="absolute w-28 h-28 rounded-full blur-2xl glow"
            style={{ background: `${safeTheme.primary}20` }}
          />

          <div className="relative block-spin w-28 h-28">

            {/* bloco 1 */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center block-float"
              style={{
                background: safeTheme.primary,
                color: "#fff"
              }}
            >
              <span className="text-xs font-bold">1</span>
            </div>

            {/* bloco 2 */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center block-float"
              style={{
                background: safeTheme.success,
                color: "#fff",
                animationDelay: "0.15s"
              }}
            >
              <span className="text-xs font-bold">2</span>
            </div>

            {/* bloco 3 */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center block-float"
              style={{
                background: safeTheme.warning,
                color: "#000",
                animationDelay: "0.3s"
              }}
            >
              <span className="text-xs font-bold">3</span>
            </div>

            {/* bloco 4 */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center block-float"
              style={{
                background: safeTheme.danger,
                color: "#fff",
                animationDelay: "0.45s"
              }}
            >
              <span className="text-xs font-bold">4</span>
            </div>

            {/* centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center"
                style={{
                  background: safeTheme.card,
                  border: `1px solid ${safeTheme.border}`
                }}
              >
                <div
                  className="w-6 h-6 rounded-md"
                  style={{ background: safeTheme.text }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 📝 TEXTO */}
        <div className="text-center">
          <h2
            style={{
              ...safeTheme.typography?.h2,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: safeTheme.text
            }}
          >
            Carregando workspace
          </h2>

          <p
            className="mt-2"
            style={{ color: safeTheme.muted }}
          >
            Montando os blocos e preparando o desafio...
          </p>
        </div>

      </div>
    </div>
  );
}