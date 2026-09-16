'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Shirt, Sparkles, User, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home },
  { href: '/armario', label: 'Armário', icon: Shirt },
  { href: '/looks', label: 'Criar', icon: Plus, isCenter: true },
  { href: '/historico', label: 'Looks', icon: Sparkles },
  { href: '/estilo', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E8E4DE',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isCenter }) => {
          const isActive = pathname === href && !isCenter;

          if (isCenter) {
            return (
              <Link
                key="criar"
                href="/looks"
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #C4B8E9 0%, #5E4F72 100%)',
                    boxShadow: '0 4px 16px rgba(196,184,233,0.35)',
                  }}
                >
                  <Icon size={22} strokeWidth={2.5} color="#FDFBF7" />
                </div>
                <span
                  className="text-[9px] font-medium"
                  style={{ color: '#5E4F72' }}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href + label}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors"
              style={{
                color: isActive ? '#5E4F72' : '#9A958F',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
