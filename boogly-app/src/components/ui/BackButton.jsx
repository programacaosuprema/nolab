import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { playSound } from "../../utils/soundManager";

export default function BackButton({
  to = -1,
  onClick,
  children = 'Voltar',
  disabled = false,
  className = '',
  style = {},
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  function handleClick() {
    if (disabled) return;

    if (onClick) {
      onClick();
      return;
    }

    navigate(to);
  }

  return (
    <button
      type="button"
      onClick={ () => { handleClick(); playSound("click");}}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        hover:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        background: theme.card,
        color: theme.text,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...theme.typography.small,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = theme.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme.card;
      }}
    >
      <ArrowLeft size={16} />
      {children}
    </button>
  );
}