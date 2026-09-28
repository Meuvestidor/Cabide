'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Loader2, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';
import { isVisitante } from '@/lib/conta';
import type { PerfilEstilo, RetratoStatus } from '@/types/database';
import {
  CAIMENTO_BAIXO,
  CAIMENTO_CIMA,
  COMPRIMENTOS,
  CORES_VETO,
  DORES,
  DRESS_CODES,
  ESTAMPAS,
  ESTILOS,
  INTENCOES,
  PALETAS,
  SENTIMENTOS,
  VETOS,
  contextoLabel,
  getRetratoStatus,
  intencoesDe,
  isPerfilEstiloV2,
  labelOf,
  linhasDeTamanho,
} from '@/lib/retrato';
import { CriarContaButton } from '@/components/conta/CriarContaButton';
import { SairButton } from '@/components/conta/SairButton';

type PecaAncora = { id: string; nome: string; imagem_url: string };
type DadosPerfil = { nome: string; email: string; celular: string | null };

// ------------------------------------------
// Utilidades
// ------------------------------------------
/** Formata celular brasileiro enquanto digita: (41) 99999-9999. */
function formatarCelular(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function SecaoTitulo({ eyebrow, titulo }: { eyebrow: string; titulo: string }) {
  return (
    <div className="mb-4">
      <p className="eyebrow mb-1">{eyebrow}</p>
      <h2 className="display text-[1.75rem]">{titulo}</h2>
    </div>
  );
}

function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-t border-border">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="display text-sm text-gold-text">{numero}</span>
        <h3 className="eyebrow text-foreground">{titulo}</h3>
      </div>
      <div className="pl-7 text-sm text-foreground">{children}</div>
    </section>
  );
}

function Chips({ itens }: { itens: string[] }) {
  if (!itens.length) return <NaoRespondido />;
  return (
    <div className="flex flex-wrap gap-1.5">
      {itens.map((i) => (
        <span key={i} className="chip">{i}</span>
      ))}
    </div>
  );
}

function NaoRespondido() {
  return <p className="text-[13px] text-muted italic">Não respondido</p>;
}

function Escala({ valor, rotulo }: { valor?: number; rotulo: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px]">{rotulo}</span>
      {valor ? (
        <span className="flex gap-1" aria-label={`${valor} de 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`w-2 h-2 rounded-full ${n <= valor ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </span>
      ) : (
        <span className="text-[13px] text-muted italic">—</span>
      )}
    </div>
  );
}

// ------------------------------------------
// MEU ESTILO — Retrato Cabidê
// ------------------------------------------
function RetratoConfirmado({ perfil, ancora }: { perfil: PerfilEstilo; ancora: PecaAncora | null }) {
  const r = perfil.respostas;
  const dress = r.dress_code ? labelOf(DRESS_CODES, r.dress_code) : '';
  const cores = [
    ...(r.cores_veto ?? []).map((c) => CORES_VETO.find((x) => x.value === c)?.label ?? c),
    ...(r.cores_veto_outra ? [r.cores_veto_outra] : []),
  ];
  const vetos = [
    ...(r.vetos ?? []).map((v) => labelOf(VETOS, v)),
    ...(r.vetos_outra ? [r.vetos_outra] : []),
  ];
  const tamanhos = linhasDeTamanho(perfil.medidas);

  return (
    <div>
      {perfil.retrato && (
        <div className="mb-8">
          <p className="eyebrow mb-3">Seu retrato de estilo</p>
          <p className="display text-[1.35rem] leading-relaxed">{perfil.retrato}</p>
          <div className="rule-gold mt-6" />
        </div>
      )}

      <Secao numero="01" titulo="Minha vida real">
        <Chips itens={[...(r.contextos ?? []).filter((c) => c !== 'outro').map(contextoLabel), ...(r.contextos_outro ? [r.contextos_outro] : [])]} />
        {dress && <p className="text-[13px] text-muted mt-2">Dress code: {dress}</p>}
      </Secao>

      <Secao numero="02" titulo="Meu estilo hoje">
        <Chips itens={(r.estilo_atual ?? []).map((e) => labelOf(ESTILOS, e))} />
      </Secao>

      <Secao numero="03" titulo="Como quero me vestir">
        <Chips itens={(r.estilo_desejado ?? []).map((e) => labelOf(ESTILOS, e))} />
      </Secao>

      <Secao numero="04" titulo="O que quero transmitir">
        <Chips itens={intencoesDe(r).map((i) => labelOf(INTENCOES, i))} />
      </Secao>

      <Secao numero="05" titulo="Conforto e ousadia">
        <Escala rotulo="Conforto" valor={r.conforto} />
        <Escala rotulo="Quanto gosto de experimentar" valor={r.ousadia} />
      </Secao>

      <Secao numero="06" titulo="Como gosto que a roupa caia">
        {r.silhueta?.cima || r.silhueta?.baixo || r.silhueta?.comprimentos?.length ? (
          <div className="space-y-1 text-[13px]">
            {r.silhueta?.cima && <p>Parte de cima: {labelOf(CAIMENTO_CIMA, r.silhueta.cima)}</p>}
            {r.silhueta?.baixo && <p>Parte de baixo: {labelOf(CAIMENTO_BAIXO, r.silhueta.baixo)}</p>}
            {!!r.silhueta?.comprimentos?.length && (
              <p>Comprimentos: {r.silhueta.comprimentos.map((c) => labelOf(COMPRIMENTOS, c)).join(', ')}</p>
            )}
          </div>
        ) : (
          <NaoRespondido />
        )}
        {tamanhos.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="eyebrow mb-1.5">Meus tamanhos</p>
            <div className="space-y-0.5 text-[13px]">
              {tamanhos.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        )}
      </Secao>

      <Secao numero="07" titulo="Cores e estampas">
        {r.paletas?.length || r.estampas || cores.length ? (
          <div className="space-y-2">
            {!!r.paletas?.length && <Chips itens={r.paletas.map((p) => labelOf(PALETAS, p))} />}
            {r.estampas && <p className="text-[13px]">Estampas: {labelOf(ESTAMPAS, r.estampas)}</p>}
            {cores.length > 0 && <p className="text-[13px] text-muted">Evita: {cores.join(', ')}</p>}
          </div>
        ) : (
          <NaoRespondido />
        )}
      </Secao>

      <Secao numero="08" titulo="O que não funciona para mim">
        {vetos.length || r.dor_principal ? (
          <div className="space-y-2">
            {vetos.length > 0 && <Chips itens={vetos} />}
            {r.dor_principal && <p className="text-[13px] text-muted">{labelOf(DORES, r.dor_principal)}</p>}
          </div>
        ) : (
          <NaoRespondido />
        )}
      </Secao>

      <Secao numero="09" titulo="Como quero me sentir">
        <Chips itens={(r.estado_desejado ?? []).map((s) => labelOf(SENTIMENTOS, s))} />
      </Secao>

      {ancora && (
        <Secao numero="—" titulo="A peça mais eu">
          <div className="flex items-center gap-4">
            <div className="w-16 h-[84px] overflow-hidden rounded-[2px] bg-surface-alt flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ancora.imagem_url} alt={ancora.nome} className="w-full h-full object-cover" />
            </div>
            <p className="display text-lg">{ancora.nome}</p>
          </div>
        </Secao>
      )}

      <div className="border-t border-border pt-6">
        <Link href="/retrato?editar=1" className="btn btn-outline w-full">
          Editar meu estilo
        </Link>
      </div>
    </div>
  );
}

function ConviteRetrato({ status }: { status: RetratoStatus }) {
  if (status === 'completed') {
    return (
      <div>
        <p className="eyebrow mb-3">Retrato Cabidê</p>
        <h3 className="display text-[1.5rem] mb-3">Seu retrato está pronto para revisão.</h3>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Confirme seu perfil para que seus looks passem a partir de quem você é.
        </p>
        <Link href="/retrato" className="btn btn-primary w-full">
          Revisar e confirmar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-3">Retrato Cabidê</p>
      <h3 className="display text-[1.5rem] mb-3">Queremos conhecer você.</h3>
      <p className="text-sm text-muted leading-relaxed mb-3">
        Conte ao Cabidê como é a sua rotina, o que você gosta e como quer se sentir ao se vestir. Quanto mais
        conhecemos você, mais personalizados serão seus looks.
      </p>
      <p className="text-[13px] text-muted mb-6">Leva cerca de 3 minutos.</p>
      <Link href="/retrato?iniciar=1" className="btn btn-primary w-full">
        Criar meu perfil de estilo
      </Link>
    </div>
  );
}

// ------------------------------------------
// Edição dos dados pessoais (nome e celular; o e-mail vem do Google)
// ------------------------------------------
function EditarPerfilSheet({
  userId,
  dados,
  onFechar,
  onSalvo,
}: {
  userId: string;
  dados: DadosPerfil;
  onFechar: () => void;
  onSalvo: (d: DadosPerfil) => void;
}) {
  const [nome, setNome] = useState(dados.nome);
  const [celular, setCelular] = useState(dados.celular ? formatarCelular(dados.celular) : '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const digitos = celular.replace(/\D/g, '');
  const celularValido = digitos.length === 0 || digitos.length === 10 || digitos.length === 11;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!celularValido) {
      setErro('Confira o celular: use DDD + número.');
      return;
    }
    setErro(null);
    setSalvando(true);
    const supabase = createClient();
    const novo = { nome: nome.trim(), celular: digitos ? formatarCelular(digitos) : null };
    const { data, error } = await supabase.from('profiles').update(novo).eq('id', userId).select('id');
    setSalvando(false);
    if (error || !data?.length) {
      console.error('[Perfil] Falha ao salvar:', error?.message ?? 'nenhuma linha atualizada');
      setErro('Não conseguimos salvar agora. Tente novamente.');
      return;
    }
    onSalvo({ ...dados, ...novo });
  }

  return (
    <div className="fixed inset-0 z-[60] bg-foreground/40 flex items-end sm:items-center justify-center" onClick={onFechar}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-perfil-titulo"
        onSubmit={salvar}
        className="sheet sm:rounded-[4px] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <h2 id="editar-perfil-titulo" className="display text-[1.75rem]">
            Editar meu perfil
          </h2>
          <button type="button" onClick={onFechar} className="p-1 text-muted" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <label htmlFor="perfil-nome" className="eyebrow block mb-2">Nome</label>
        <input
          id="perfil-nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={80}
          autoComplete="name"
          className="input mb-5"
        />

        <p className="eyebrow mb-2">E-mail</p>
        <p className="text-sm text-muted mb-5 break-all">{dados.email || '—'}</p>

        <label htmlFor="perfil-celular" className="eyebrow block mb-2">
          Celular <span className="normal-case tracking-normal font-normal">(opcional)</span>
        </label>
        <input
          id="perfil-celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={celular}
          onChange={(e) => setCelular(formatarCelular(e.target.value))}
          placeholder="(41) 99999-9999"
          className="input mb-2"
        />

        {erro && (
          <p role="alert" className="text-[13px] text-danger mb-2">
            {erro}
          </p>
        )}

        <button type="submit" disabled={salvando} className="btn btn-primary w-full mt-4">
          {salvando ? <Loader2 size={18} className="animate-spin" /> : 'Salvar'}
        </button>
      </form>
    </div>
  );
}

// ------------------------------------------
// Página
// ------------------------------------------
function MensagemConta() {
  const params = useSearchParams();
  const [erroHash, setErroHash] = useState<string | null>(null);
  const [fechada, setFechada] = useState(false);

  useEffect(() => {
    // Alguns erros do provedor chegam no fragmento (#error_code=...)
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setErroHash(h.get('error_code') || h.get('error'));
  }, []);

  const criada = params.get('conta') === 'criada';
  const erro = params.get('conta_erro') || erroHash;
  if (fechada || (!criada && !erro)) return null;

  const texto = erro
    ? erro === 'identity_already_exists'
      ? 'Essa conta Google já está ligada a outro Cabidê. Você continua experimentando e nada foi perdido.'
      : 'Não conseguimos concluir a criação da sua conta. Seus dados continuam aqui — tente novamente.'
    : 'Pronto! Sua conta foi criada e tudo o que você fez continua aqui.';

  return (
    <div role="status" className={`relative mb-6 p-4 pr-10 border-l-2 bg-surface ${erro ? 'border-danger' : 'border-gold'}`}>
      <p className="text-[13px] text-foreground leading-relaxed">{texto}</p>
      <button type="button" onClick={() => setFechada(true)} className="absolute top-3 right-3 p-1 text-muted" aria-label="Fechar">
        <X size={14} />
      </button>
    </div>
  );
}

function ItemConta({ label, onClick, href, emBreve }: { label: string; onClick?: () => void; href?: string; emBreve?: boolean }) {
  const conteudo = (
    <>
      <span className={`text-sm ${emBreve ? 'text-muted' : 'text-foreground'}`}>{label}</span>
      {emBreve ? <span className="text-[11px] text-muted">Em breve</span> : <ChevronRight size={16} className="text-muted" />}
    </>
  );
  const cls = 'w-full flex items-center justify-between py-4 border-b border-border text-left';
  if (emBreve) return <div className={cls} aria-disabled="true">{conteudo}</div>;
  if (href) return <Link href={href} className={cls}>{conteudo}</Link>;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {conteudo}
    </button>
  );
}

function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [dados, setDados] = useState<DadosPerfil>({ nome: '', email: '', celular: null });
  const [perfil, setPerfil] = useState<PerfilEstilo | null>(null);
  const [status, setStatus] = useState<RetratoStatus>('nao_iniciado');
  const [ancora, setAncora] = useState<PecaAncora | null>(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email, celular, perfil_estilo')
        .eq('id', user.id)
        .single();

      setDados({
        nome: profile?.nome || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '',
        email: profile?.email || user.email || '',
        celular: profile?.celular ?? null,
      });

      const pe = profile?.perfil_estilo;
      setStatus(getRetratoStatus(pe));
      if (isPerfilEstiloV2(pe)) {
        setPerfil(pe);
        const ancoraId = pe.respostas.pecas_ancora?.[0];
        if (ancoraId) {
          const { data: peca } = await supabase
            .from('pecas')
            .select('id, nome, imagem_url')
            .eq('id', ancoraId)
            .maybeSingle();
          if (peca) setAncora(peca as PecaAncora);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center pt-24">
        <div className="loader-line" />
      </div>
    );
  }

  const visitante = isVisitante(user);

  return (
    <div className="pt-8 pb-6">
      {/* ---------------- MEU PERFIL ---------------- */}
      <p className="eyebrow mb-1">Meu perfil</p>
      <MensagemConta />

      {visitante ? (
        <section className="mb-12">
          <h1 className="display text-[2.25rem] leading-tight mb-3">Você está experimentando o Cabidê</h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Crie sua conta para guardar seu armário, seu estilo e suas preferências.
          </p>
          <CriarContaButton next="/estilo" />
        </section>
      ) : (
        <section className="mb-12">
          <h1 className="display text-[2.25rem] leading-tight break-words">{dados.nome || 'Seu nome'}</h1>
          <div className="mt-2 space-y-0.5 text-sm text-muted">
            {dados.email && <p className="break-all">{dados.email}</p>}
            {dados.celular && <p>{dados.celular}</p>}
          </div>
          <button type="button" onClick={() => setEditando(true)} className="btn btn-outline mt-5 min-h-11 px-5">
            Editar meu perfil
          </button>
        </section>
      )}

      {/* ---------------- MEU ESTILO ---------------- */}
      <section className="mb-12">
        <SecaoTitulo eyebrow="Retrato Cabidê" titulo="Meu estilo" />
        {status === 'confirmed' && perfil ? (
          <RetratoConfirmado perfil={perfil} ancora={ancora} />
        ) : (
          <ConviteRetrato status={status} />
        )}
      </section>

      {/* ---------------- MINHA CONTA ---------------- */}
      <section>
        <SecaoTitulo eyebrow="Conta" titulo="Minha conta" />
        <div className="border-t border-border">
          {!visitante && (
            <>
              <ItemConta label="Dados pessoais" onClick={() => setEditando(true)} />
              <ItemConta label="Editar meu perfil" onClick={() => setEditando(true)} />
            </>
          )}
          <ItemConta label="Preferências de estilo" href="/retrato?editar=1" />
          <ItemConta label="Privacidade" emBreve />
          <ItemConta label="Termos de uso" emBreve />
          <ItemConta label="Ajuda" emBreve />
          <SairButton visitante={visitante} />
        </div>
      </section>

      {editando && user && !visitante && (
        <EditarPerfilSheet
          userId={user.id}
          dados={dados}
          onFechar={() => setEditando(false)}
          onSalvo={(d) => {
            setDados(d);
            setEditando(false);
          }}
        />
      )}
    </div>
  );
}

export default function EstiloPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center pt-24">
          <div className="loader-line" />
        </div>
      }
    >
      <PerfilPage />
    </Suspense>
  );
}
