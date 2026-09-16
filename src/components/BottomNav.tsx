'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Shirt, Sparkles, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home },
  { href: '/armario', label: 'Armário', icon: Shirt },
  { href: '/looks', label: 'Looks', icon: Sparkles },
  { href: '/estilo', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
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
