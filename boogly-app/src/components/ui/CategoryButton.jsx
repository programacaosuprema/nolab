
import { playSound } from "../../utils/soundManager";

export function CategoryButton({ label, active, onClick, theme }) {
  return (
    <div className="group relative">
      <button
        onClick={ () => {onClick(); playSound("click");}}
        className="w-10 h-10 rounded-full transition"
        style={{
          background: active ? theme.primary : theme.hover,
          transform: active ? 'scale(1.06)' : 'scale(1)',
        }}
      />
      <span
        className="absolute left-12 top-1/2 -translate-y-1/2
                   text-xs px-2 py-1 rounded whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition pointer-events-none z-50"
        style={{
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.border}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}