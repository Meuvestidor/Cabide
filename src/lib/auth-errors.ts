// Traduz mensagens do Supabase Auth para PT-BR humano.
// Nunca exibir a mensagem técnica original para a usuária.
export function authErrorMessage(message: string | undefined | null): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  if (m.includes('password') && (m.includes('at least') || m.includes('should be') || m.includes('characters')))
    return 'A senha deve ter no mínimo 6 caracteres.';
  if (m.includes('same password') || m.includes('different from the old'))
    return 'A nova senha precisa ser diferente da anterior.';
  if (m.includes('fetch') || m.includes('network')) return 'Parece que a conexão caiu. Verifique sua internet e tente de novo.';
  return 'Não foi possível concluir agora. Tente novamente em instantes.';
}
