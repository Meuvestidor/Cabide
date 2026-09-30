import { createClient } from '@/lib/supabase-client';

// Encerra a sessão e limpa qualquer cache local do app (service worker).
export async function logout() {
  try {
    await createClient().auth.signOut();
  } finally {
    try {
      navigator.serviceWorker?.controller?.postMessage('CLEAR_CACHES');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {}
    window.location.replace('/login');
  }
}
