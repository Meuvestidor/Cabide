'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
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
  isPerfilEstiloV2,
  labelOf,
} from '@/lib/retrato';

type PecaAncora = { id: string; nome: string; imagem_url: string };

function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-t border-border">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="display text-sm text-gold-text">{numero}</span>
        <h2 className="eyebrow text-foreground">{titulo}</h2>
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

function PerfilConfirmado({ perfil, ancora }: { perfil: PerfilEstilo; ancora: PecaAncora | null }) {
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

  return (
    <div className="pt-8 pb-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="display text-[2.25rem]">Meu estilo</h1>
        <Link href="/retrato?editar=1" className="text-sm font-semibold underline underline-offset-4 decoration-gold mt-3">
          Editar meu perfil
        </Link>
      </div>
      <p className="text-[13px] text-muted mb-8">Seu estilo evolui com você.</p>

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
        {r.intencao_imagem ? <p className="display text-lg">{labelOf(INTENCOES, r.intencao_imagem)}</p> : <NaoRespondido />}
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
        {(perfil.medidas?.tamanho_roupa || perfil.medidas?.tamanho_calcado) && (
          <p className="text-[13px] text-muted mt-2">
            {perfil.medidas?.tamanho_roupa && `Roupa ${perfil.medidas.tamanho_roupa}`}
            {perfil.medidas?.tamanho_roupa && perfil.medidas?.tamanho_calcado && ' · '}
            {perfil.medidas?.tamanho_calcado && `Calçado ${perfil.medidas.tamanho_calcado}`}
          </p>
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
          Editar meu perfil
        </Link>
      </div>
    </div>
  );
}

function Convite({ status }: { status: RetratoStatus }) {
  if (status === 'completed') {
    return (
      <div className="pt-8">
        <h1 className="display text-[2.25rem] mb-8">Meu estilo</h1>
        <p className="eyebrow mb-3">Retrato Cabidê</p>
        <h2 className="display text-[1.75rem] mb-3">Seu retrato está pronto para revisão.</h2>
        <p className="text-sm text-muted leading-relaxed mb-8">
          Confirme seu perfil para que seus looks passem a partir de quem você é.
        </p>
        <Link href="/retrato" className="btn btn-primary w-full">
          Revisar e confirmar
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <h1 className="display text-[2.25rem] mb-8">Meu estilo</h1>
      <p className="eyebrow mb-3">Retrato Cabidê</p>
      <h2 className="display text-[1.75rem] mb-3">Queremos conhecer você.</h2>
      <p className="text-sm text-muted leading-relaxed mb-3">
        Conte ao Cabidê como é a sua rotina, o que você gosta e como quer se sentir ao se vestir. Quanto mais
        conhecemos você, mais personalizados serão seus looks.
      </p>
      <p className="text-[13px] text-muted mb-8">Leva cerca de 3 minutos.</p>
      <Link href="/retrato?iniciar=1" className="btn btn-primary w-full">
        Criar meu perfil de estilo
      </Link>
    </div>
  );
}

export default function EstiloPage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<PerfilEstilo | null>(null);
  const [status, setStatus] = useState<RetratoStatus>('nao_iniciado');
  const [ancora, setAncora] = useState<PecaAncora | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('perfil_estilo')
        .eq('id', user.id)
        .single();

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

  if (status === 'confirmed' && perfil) {
    return <PerfilConfirmado perfil={perfil} ancora={ancora} />;
  }

  return <Convite status={status} />;
}
