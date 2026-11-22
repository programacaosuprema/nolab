import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { playSound } from "../../utils/soundManager";

export default function SoundToggle() {
  const { theme } = useTheme();

  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('nolab-sound') !== 'false'
  );

  function toggleSound() {
    const next = !enabled;

    setEnabled(next);
    localStorage.setItem('nolab-sound', String(next));
  }

  return (
    <button
      type="button"
      onClick={ () => {toggleSound(); playSound("click");}}
      title={enabled ? 'Desativar sons' : 'Ativar sons'}
      aria-label={enabled ? 'Desativar sons' : 'Ativar sons'}
      aria-pressed={enabled}
      className="
        flex items-center justify-center
        w-10 h-10 rounded-lg
        cursor-pointer
        transition-all duration-200
        hover:opacity-80
      "
      style={{
        backgroundColor: theme.toolbox,
        color: enabled ? theme.primary : theme.text,
        border: `1px solid ${theme.border}`,
      }}
    >
      {enabled ? (
        <Volume2 size={20} />
      ) : (
        <VolumeX size={20} />
      )}
    </button>
  );
}