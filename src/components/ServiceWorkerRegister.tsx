'use client';

import { useEffect } from 'react';

// Registra o service worker só em produção. A versão muda a cada deploy,
// o que instala um SW novo e descarta os caches antigos.
export default function ServiceWorkerRegister({ version }: { version: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(version)}`, { scope: '/', updateViaCache: 'none' })
      .catch(() => {});
  }, [version]);
  return null;
}
