'use client';

import { Check } from 'lucide-react';

type Opcao<T extends string> = { value: T; label: string; amostras?: string[]; hex?: string };

function Swatches({ cores }: { cores: string[] }) {
  return (
    <span className="flex -space-x-1 flex-shrink-0" aria-hidden="true">
      {cores.map((c) => (
        <span key={c} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

/** Opção com borda de 1px; selecionada = Deep Green + Cream + check. */
export function OptionButton({
  selected,
  disabled,
  onClick,
  children,
  role = 'checkbox',
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: 'checkbox' | 'radio';
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled && !selected}
      onClick={onClick}
      className="option justify-between"
    >
      <span className="flex items-center gap-3 min-w-0">{children}</span>
      <span
        className={`w-4 h-4 flex-shrink-0 flex items-center justify-center ${
          role === 'radio' ? 'rounded-full' : 'rounded-[2px]'
        } ${selected ? '' : 'border border-sand'}`}
        aria-hidden="true"
      >
        {selected && <Check size={14} strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/** Múltipla escolha com limite opcional. */
export function MultiSelect<T extends string>({
  opcoes,
  valores,
  onChange,
  max,
  colunas = 1,
}: {
  opcoes: Opcao<T>[];
  valores: T[];
  onChange: (v: T[]) => void;
  max?: number;
  colunas?: 1 | 2;
}) {
  const cheio = max !== undefined && valores.length >= max;
  return (
    <div className={`grid gap-2 ${colunas === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {opcoes.map((o) => {
        const selected = valores.includes(o.value);
        return (
          <OptionButton
            key={o.value}
            selected={selected}
            disabled={cheio}
            onClick={() => onChange(selected ? valores.filter((v) => v !== o.value) : [...valores, o.value])}
          >
            {o.amostras && <Swatches cores={o.amostras} />}
            {o.hex && <Swatches cores={[o.hex]} />}
            <span className="leading-snug">{o.label}</span>
          </OptionButton>
        );
      })}
    </div>
  );
}

/** Escolha única. Tocar de novo na opção selecionada a desmarca. */
export function SingleSelect<T extends string>({
  opcoes,
  valor,
  onChange,
  colunas = 1,
}: {
  opcoes: Opcao<T>[];
  valor: T | undefined;
  onChange: (v: T | undefined) => void;
  colunas?: 1 | 2;
}) {
  return (
    <div role="radiogroup" className={`grid gap-2 ${colunas === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {opcoes.map((o) => (
        <OptionButton
          key={o.value}
          role="radio"
          selected={valor === o.value}
          onClick={() => onChange(valor === o.value ? undefined : o.value)}
        >
          <span className="leading-snug">{o.label}</span>
        </OptionButton>
      ))}
    </div>
  );
}

/** Contador contextual: selecionadas / máximo permitido. */
export function Contador({ atual, max }: { atual: number; max: number }) {
  return (
    <p className="text-[12px] font-semibold text-foreground" aria-live="polite">
      {atual} de {max}
    </p>
  );
}
