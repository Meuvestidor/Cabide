'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useT } from '@/i18n/client';
import { logout } from '@/lib/logout';

export default function LogoutButton() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        logout();
      }}
      className="mx-auto mt-6 mb-2 flex items-center gap-1.5 text-sm text-muted hover:underline"
    >
      <LogOut size={14} />
      {t('auth.logout')}
    </button>
  );
}
