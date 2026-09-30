'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { useT } from '@/i18n/client';
import { PENDING_INVITE_KEY } from '@/lib/invite';
import { logout } from '@/lib/logout';

export default function ConvitePage() {
  const t = useT();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redeem = useCallback(
    async (value: string) => {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch('/api/beta/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: value.trim().toUpperCase() }),
        });
        const json = await res.json();
        if (json.status === 'ok') {
          try { localStorage.removeItem(PENDING_INVITE_KEY); } catch {}
          window.location.replace('/inicio');
          return;
        }
        setError(t(`invite.status.${typeof json.status === 'string' ? json.status : 'generic'}`));
      } catch {
        setError(t('invite.status.generic'));
      }
      setLoading(false);
    },
    [t],
  );

  // Convite informado no cadastro com Google: resgata automaticamente.
  useEffect(() => {
    let pending: string | null = null;
    try { pending = localStorage.getItem(PENDING_INVITE_KEY); } catch {}
    if (pending) {
      setCode(pending);
      redeem(pending);
    }
  }, [redeem]);

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-12 pb-8" style={{ background: '#FDFBF7' }}>
      <div className="text-center mb-8">
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 600,
            color: '#5E4F72',
          }}
        >
          {t('invite.title')}
        </h1>
        <p className="mt-2" style={{ fontSize: '0.875rem', color: '#6B6560' }}>
          {t('invite.body')}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) redeem(code);
        }}
        className="flex flex-col gap-4 w-full max-w-sm mx-auto"
      >
        <div>
          <label htmlFor="invite" className="block mb-1" style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2D2A26' }}>
            {t('auth.signup.inviteLabel')}
          </label>
          <div className="relative">
            <Ticket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9A958F' }} />
            <input
              id="invite"
              type="text"
              placeholder={t('auth.signup.invitePlaceholder')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              className="w-full pl-10 pr-4"
              style={{
                height: '48px',
                border: '1.5px solid #E8E4DE',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                background: '#FFFFFF',
                color: '#2D2A26',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{ background: '#FDF0EF', color: '#B5443A', border: '1px solid rgba(181,68,58,0.15)' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-2"
          style={{
            height: '48px',
            background: loading ? '#D5D0DC' : '#5E4F72',
            color: '#FDFBF7',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('invite.submitting')}
            </>
          ) : (
            t('invite.submit')
          )}
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="text-center mt-2"
          style={{ fontSize: '0.8125rem', color: '#6B6560', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          {t('invite.logout')}
        </button>
      </form>
    </div>
  );
}
