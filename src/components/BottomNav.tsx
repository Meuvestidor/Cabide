'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Shirt, User, Plus } from 'lucide-react';
import { HangerIcon } from '@/components/icons';

const NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: 'home' },
  { href: '/armario', label: 'Armário', icon: 'shirt' },
  { href: '/looks', label: 'Criar', icon: 'plus', isCenter: true },
  { href: '/historico', label: 'Looks', icon: 'hanger' },
  { href: '/estilo', label: 'Perfil', icon: 'user' },
] as const;

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 2 : 1.5;
  const fill = active ? 'currentColor' : 'none';
  switch (name) {
    case 'home':
      return <Home size={22} strokeWidth={stroke} fill={fill} fillOpacity={active ? 1 : 0} />;
    case 'shirt':
      return <Shirt size={22} strokeWidth={stroke} fill={fill} fillOpacity={active ? 1 : 0} />;
    case 'user':
      return <User size={22} strokeWidth={stroke} fill={fill} fillOpacity={active ? 1 : 0} />;
    case 'hanger':
      return <HangerIcon size={22} strokeWidth={stroke} filled={active} />;
    default:
      return null;
  }
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegação principal"
    >
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          if ('isCenter' in item && item.isCenter) {
            return (
              <Link
                key="criar"
                href={item.href}
                className="flex flex-col items-center gap-1 pb-2 -mt-5"
                aria-label="Criar look"
              >
                <span className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                  <Plus size={24} strokeWidth={1.75} className="text-background" />
                </span>
                <span className="text-[10px] font-medium text-muted">{item.label}</span>
              </Link>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 pb-2 pt-2 min-w-14 transition-colors ${
                isActive ? 'text-foreground' : 'text-muted'
              }`}
            >
              <NavIcon name={item.icon} active={isActive} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
