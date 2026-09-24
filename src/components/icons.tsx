// Ícones próprios do Cabidê que não existem no lucide-react (mesma grade 24×24 e traço).

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
};

/** Cabide — usado na navegação (Looks) e em estados vazios. */
export function HangerIcon({ size = 24, strokeWidth = 1.6, className, filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 5.5a2 2 0 1 1 2.8 1.83c-.5.22-.8.72-.8 1.27V9.5" />
      <path
        d="M12 9.5 3.4 15.6a1 1 0 0 0 .58 1.9h16.04a1 1 0 0 0 .58-1.9L12 9.5Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

/** Marca Cabidê: coração + cabide. */
export function CabideMark({ size = 28, className, color = 'currentColor' }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size * (30 / 28)} viewBox="0 0 28 30" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 6C14 6 10 2 7 4.5C4 7 6 11 14 16C22 11 24 7 21 4.5C18 2 14 6 14 6Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 16L14 20M14 20L5 26.5H23L14 20Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
