import 'server-only';

// ============================================
// CABIDÊ — Configuração central de acesso
// ============================================
// Único ponto que decide se a beta é pública ou privada.
// Vercel → Settings → Environment Variables:
//   CABIDE_PUBLIC_BETA=false  → só entra quem tem convite (padrão)
//   CABIDE_PUBLIC_BETA=true   → cadastro livre
export function isPublicBeta(): boolean {
  return process.env.CABIDE_PUBLIC_BETA === 'true';
}
