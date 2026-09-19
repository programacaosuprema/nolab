// src/components/ui/ActionButton.jsx
import { useTheme } from '../../theme/useTheme';
import { useState, useCallback } from 'react';

/**
 * ActionButton — componente acessível e compatível com GuidedTour
 *
 * Props conhecidos:
 * - children, icon (componente), onClick, variant, disabled, loading
 * - aceita quaisquer props extras e os repassa para o <button> (ex: data-tour, id, aria-*, className)
 *
 * Behaviour:
 * - se onClick retornar Promise, mostra estado interno de processamento
 * - prop `loading` externo tem precedência: se true, mostra loading
 * - evita manipular o DOM diretamente (usa hover/pressed state)
 */
export default function ActionButton({
  children,
  icon: Icon,
  onClick,
  variant = 'default',
  disabled = false,
  loading = false,
  // pega tudo que mais vier (data-tour, id, className etc.)
  ...rest
}) {
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: theme.primary,
    success: theme.success,
    danger: theme.danger,
    default: theme.card,
  };

  const baseColor = variants[variant] || variants.default;
  const externallyDisabled = disabled;
  const externallyLoading = loading;

  const isDisabled = externallyDisabled || externallyLoading || isProcessing;

  // handleClick centralizado: executa onClick e trata Promise
  const handleClick = useCallback(
    async (e) => {
      if (!onClick || isDisabled) return;
      try {
        const result = onClick(e);
        if (result instanceof Promise) {
          setIsProcessing(true);
          await result;
        }
      } catch (err) {
        // deixe o erro seguir para console; não precisamos explodir a UI
        console.error('Erro no botão:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [onClick, isDisabled]
  );

  // mescla className passado via rest com as classes internas
  const extraClassName = rest.className || '';
  const mergedClassName =
    `${extraClassName} flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200`.trim();

  // estilo inline calculado (usa hover/pressed states ao invés de mutar DOM)
  const transformStyle = pressed
    ? 'scale(0.96)'
    : hover
      ? 'translateY(-2px)'
      : 'translateY(0)';
  const boxShadow = isDisabled ? 'none' : '0 2px 6px rgba(0,0,0,0.12)';

  return (
    <button
      // repassa rest (props extras como data-tour, id, aria-*, etc.)
      {...rest}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isDisabled}
      className={mergedClassName}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      // outline/keyboard focus respeitado naturalmente; se quiser, adicione :focus styles via CSS/Tailwind
      style={{
        background: baseColor,
        color: variant === 'default' ? theme.text : '#fff',
        boxShadow,
        opacity: isDisabled ? 0.65 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transform: transformStyle,
      }}
    >
      {/* Ícone / loading spinner */}
      {externallyLoading || isProcessing ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
          style={{
            // spinner usa cor do texto (white para primary variants)
            color: variant === 'default' ? theme.text : '#fff',
          }}
        />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}

      <span>
        {externallyLoading || isProcessing ? 'Processando...' : children}
      </span>
    </button>
  );
}
