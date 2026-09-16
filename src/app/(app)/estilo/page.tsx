'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Loader2, Send, RefreshCw, Sparkles, Briefcase, Palette, Ban, Ruler } from 'lucide-react';
import type { PerfilEstilo } from '@/types/database';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================
// PROFILE SUMMARY VIEW (when interview is done)
// ============================================
function ProfileSummary({
  perfil,
  onRefazer,
}: {
  perfil: PerfilEstilo;
  onRefazer: () => void;
}) {
  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Meu Estilo</h1>
          <p className="text-muted text-sm mt-1">Seu perfil personalizado</p>
        </div>
        <button
          onClick={onRefazer}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
        >
          <RefreshCw size={14} />
          Refazer
        </button>
      </div>

      {/* Vida profissional */}
      <section className="rounded-2xl bg-surface border border-border p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
            Vida profissional
          </h2>
        </div>
        <div className="space-y-2 text-sm">
          {perfil.vida_profissional.profissao && (
            <p className="text-foreground">
              <span className="text-muted">Profissão:</span>{' '}
              {perfil.vida_profissional.profissao}
            </p>
          )}
          {perfil.vida_profissional.rotina && (
            <p className="text-foreground">
              <span className="text-muted">Rotina:</span>{' '}
              {perfil.vida_profissional.rotina}
            </p>
          )}
          {perfil.vida_profissional.compromissos?.length > 0 && (
            <div>
              <span className="text-muted">Compromissos:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {perfil.vida_profissional.compromissos.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-surface-alt text-xs text-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estilo */}
      <section className="rounded-2xl bg-surface border border-border p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Palette size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
            Estilo
          </h2>
        </div>
        <div className="space-y-2 text-sm">
          {perfil.estilo.pecas_basicas?.length > 0 && (
            <div>
              <span className="text-muted">Peças favoritas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {perfil.estilo.pecas_basicas.map((p, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-primary/10 text-xs text-primary font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {perfil.estilo.cores_preferidas?.length > 0 && (
            <div>
              <span className="text-muted">Cores preferidas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {perfil.estilo.cores_preferidas.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-surface-alt text-xs text-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {perfil.estilo.cores_evita?.length > 0 && (
            <div>
              <span className="text-muted">Cores que evita:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {perfil.estilo.cores_evita.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-danger/10 text-xs text-danger"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {perfil.estilo.como_quer_ser_percebida && (
            <p className="text-foreground">
              <span className="text-muted">Quer ser percebida como:</span>{' '}
              {perfil.estilo.como_quer_ser_percebida}
            </p>
          )}
        </div>
      </section>

      {/* Limites */}
      <section className="rounded-2xl bg-surface border border-border p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Ban size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
            Limites
          </h2>
        </div>
        <div className="space-y-2 text-sm">
          {perfil.limites.pecas_nunca_usa?.length > 0 && (
            <div>
              <span className="text-muted">Nunca usa:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {perfil.limites.pecas_nunca_usa.map((p, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-danger/10 text-xs text-danger"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tamanhos */}
      <section className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Ruler size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
            Tamanhos
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {perfil.limites.tamanho_roupa && (
            <div className="rounded-xl bg-surface-alt p-3 text-center">
              <p className="text-muted text-xs mb-1">Roupa</p>
              <p className="text-foreground font-semibold">
                {perfil.limites.tamanho_roupa}
              </p>
            </div>
          )}
          {perfil.limites.tamanho_calcado && (
            <div className="rounded-xl bg-surface-alt p-3 text-center">
              <p className="text-muted text-xs mb-1">Calçado</p>
              <p className="text-foreground font-semibold">
                {perfil.limites.tamanho_calcado}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================
// CHAT BUBBLE
// ============================================
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
          <Sparkles size={14} className="text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-surface border border-border text-foreground rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ============================================
// TYPING INDICATOR
// ============================================
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
        <Sparkles size={14} className="text-primary" />
      </div>
      <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function EstiloPage() {
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<PerfilEstilo | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<PerfilEstilo | null>(null);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserName(user.user_metadata?.nome || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('perfil_estilo, onboarding_completo')
        .eq('id', user.id)
        .single();

      if (profile?.perfil_estilo) {
        setExistingProfile(profile.perfil_estilo as PerfilEstilo);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  // Start interview
  async function startInterview() {
    setShowChat(true);
    setMessages([]);
    setInterviewComplete(false);
    setPendingProfile(null);
    setSending(true);

    try {
      const res = await fetch('/api/style-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Olá, meu nome é ${userName || 'eu'}. Quero descobrir meu perfil de estilo!` }],
          userName,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages([
          { role: 'user', content: `Olá, meu nome é ${userName || 'eu'}. Quero descobrir meu perfil de estilo!` },
          { role: 'assistant', content: data.message },
        ]);
      }
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: 'Desculpe, houve um erro ao iniciar a entrevista. Tente novamente.',
        },
      ]);
    }

    setSending(false);
  }

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch('/api/style-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, userName }),
      });

      const data = await res.json();

      if (data.message) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.message },
        ]);
      }

      if (data.isComplete && data.perfilEstilo) {
        setInterviewComplete(true);
        setPendingProfile(data.perfilEstilo);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Desculpe, houve um erro. Tente enviar sua resposta novamente.',
        },
      ]);
    }

    setSending(false);
  }

  // Save profile
  async function handleSaveProfile() {
    if (!pendingProfile) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        perfil_estilo: pendingProfile,
        onboarding_completo: true,
      })
      .eq('id', user.id);

    if (!error) {
      setExistingProfile(pendingProfile);
      setShowChat(false);
      setPendingProfile(null);
      setInterviewComplete(false);
      setMessages([]);
    }

    setSaving(false);
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  // Show existing profile
  if (existingProfile && !showChat) {
    return (
      <ProfileSummary
        perfil={existingProfile}
        onRefazer={startInterview}
      />
    );
  }

  // Show chat interview
  if (showChat) {
    return (
      <div className="flex flex-col h-[calc(100dvh-5rem)]">
        {/* Header */}
        <div className="pt-6 pb-3 flex-shrink-0">
          <h1 className="text-2xl text-foreground">Entrevista de Estilo</h1>
          <p className="text-muted text-sm mt-1">
            Converse com sua estilista pessoal
          </p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto py-3 -mx-4 px-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
          {sending && <TypingIndicator />}

          {/* Interview complete — confirm button */}
          {interviewComplete && pendingProfile && (
            <div className="mt-4 p-4 rounded-2xl bg-success/10 border border-success/20">
              <p className="text-sm text-foreground font-medium mb-3">
                Seu perfil de estilo está pronto!
              </p>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {saving ? 'Salvando...' : 'Confirmar meu perfil'}
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        {!interviewComplete && (
          <form
            onSubmit={handleSend}
            className="flex-shrink-0 py-3 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua resposta..."
              disabled={sending}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    );
  }

  // Welcome / start interview
  return (
    <div className="pt-8">
      <h1 className="text-2xl text-foreground mb-2">Meu Perfil de Estilo</h1>
      <p className="text-muted text-sm mb-6">
        Complete sua entrevista de estilo para looks mais personalizados.
      </p>
      <div className="rounded-2xl bg-surface border border-border p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={32} className="text-primary" />
        </div>
        <div>
          <p className="text-foreground font-semibold text-lg mb-1">
            Descubra seu estilo
          </p>
          <p className="text-muted text-sm max-w-xs">
            Uma conversa rápida com sua estilista pessoal para entender suas
            preferências e criar looks perfeitos para você.
          </p>
        </div>
        <button
          onClick={startInterview}
          className="mt-2 py-3 px-8 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Sparkles size={16} />
          Iniciar entrevista
        </button>
      </div>
    </div>
  );
}
