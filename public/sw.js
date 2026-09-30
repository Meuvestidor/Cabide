/* Cabidê — Service Worker
 *
 * Política de cache (segura para dados privados):
 *  - NUNCA guarda HTML de páginas, respostas de /api, fotos, sessão ou
 *    qualquer requisição ao Supabase/IA. Tudo isso vai sempre à rede.
 *  - Guarda apenas arquivos estáticos públicos e versionados do build
 *    (/_next/static/*), os ícones e a página offline.
 *  - Cada deploy registra /sw.js?v=<versão>; ao ativar, caches de versões
 *    antigas são apagados.
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `cabide-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHES') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase, fontes, etc.: sem interferência

  // Navegação: sempre rede; sem conexão → página offline genérica (sem dados da usuária).
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Estáticos versionados do build: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && response.type === 'basic') {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Todo o resto (/api, /api/fotos, RSC, etc.): comportamento padrão do navegador.
});
