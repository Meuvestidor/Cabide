'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type {
  Contexto,
  MedidasUsuaria,
  PerfilEstilo,
  RespostasRetrato,
  RetratoStatus,
} from '@/types/database';
import {
  CAIMENTO_BAIXO,
  CAIMENTO_CIMA,
  COMPRIMENTOS,
  CONTEXTO_GRUPOS,
  CORES_VETO,
  DORES,
  DRESS_CODES,
  ESTAMPAS,
  ESTILOS,
  INTENCOES,
  P1_MAX,
  PALETAS,
  SENTIMENTOS,
  TOTAL_PERGUNTAS,
  VETOS,
  buildPerfil,
  etapaValida,
  getRetratoStatus,
  isPerfilEstiloV2,
  limparEtapa,
  retratoDeterministico,
  temContextoTrabalho,
} from '@/lib/retrato';
import { CabideMark } from '@/components/icons';
import { StepShell, SubPergunta } from '@/components/retrato/StepShell';
import { Contador, MultiSelect, OptionButton, SingleSelect } from '@/components/retrato/OptionGroup';
import { ScaleSelector } from '@/components/retrato/ScaleSelector';
import { SizeFields } from '@/components/retrato/SizeFields';
import { PiecePicker, type PecaResumo } from '@/components/retrato/PiecePicker';

type Tela =
  | { tipo: 'carregando' }
  | { tipo: 'intro' }
  | { tipo: 'confirmar_pular' }
  | { tipo: 'pergunta'; etapa: number }
  | { tipo: 'compondo' }
  | { tipo: 'retrato' }
  | { tipo: 'final' };

const ETAPA_PECA = 10;

function Loader({ texto }: { texto?: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="loader-line" />
      {texto && <p className="display italic text-xl text-muted">{texto}</p>}
    </div>
  );
}

function ErroSalvar({ onTentar }: { onTentar: () => void }) {
  return (
    <div role="alert" className="mt-6 p-4 border-l-2 border-danger bg-surface">
      <p className="text-sm text-foreground">Não conseguimos salvar agora. Tente novamente.</p>
      <button type="button" onClick={onTentar} className="btn btn-outline min-h-10 text-[13px] mt-3">
        Tentar de novo
      </button>
    </div>
  );
}

function RetratoFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const modoEditar = params.get('editar') === '1';
  const iniciarDireto = params.get('iniciar') === '1';

  const [tela, setTela] = useState<Tela>({ tipo: 'carregando' });
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<RetratoStatus>('nao_iniciado');
  const [respostas, setRespostas] = useState<RespostasRetrato>({});
  const [medidas, setMedidas] = useState<MedidasUsuaria>({});
  const [retrato, setRetrato] = useState<string>('');
  const [pecas, setPecas] = useState<PecaResumo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<null | (() => void)>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      const [{ data: profile }, { data: pecasData }] = await Promise.all([
        supabase.from('profiles').select('perfil_estilo').eq('id', user.id).maybeSingle(),
        supabase
          .from('pecas')
          .select('id, nome, imagem_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(60),
      ]);
      setPecas((pecasData as PecaResumo[]) ?? []);

      const pe = profile?.perfil_estilo;
      const st = getRetratoStatus(pe);
      setStatus(st);
      if (isPerfilEstiloV2(pe)) {
        setRespostas(pe.respostas ?? {});
        setMedidas(pe.medidas ?? {});
        setRetrato(pe.retrato ?? '');
      }

      if (modoEditar || iniciarDireto) {
        setTela({ tipo: 'pergunta', etapa: 1 });
      } else if (st === 'completed' && isPerfilEstiloV2(pe)) {
        setTela({ tipo: 'retrato' });
      } else if (st === 'confirmed') {
        router.replace('/estilo');
      } else {
        setTela({ tipo: 'intro' });
      }
    }
    load();
  }, [router, modoEditar, iniciarDireto]);

  // Persistência: única fonte de verdade é profiles.perfil_estilo.
  // Verifica que uma linha foi realmente atualizada; nunca simula sucesso.
  const salvar = useCallback(
    async (perfil: PerfilEstilo, extra: Record<string, unknown> = {}): Promise<boolean> => {
      if (!userId) return false;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({ perfil_estilo: perfil, ...extra })
        .eq('id', userId)
        .select('id');
      if (error || !data || data.length === 0) {
        console.error(
          '[Retrato] Falha ao salvar perfil_estilo.',
          error ? error.message : `Nenhuma linha em profiles para o usuário ${userId}.`
        );
        return false;
      }
      return true;
    },
    [userId]
  );

  const atualizar = (patch: Partial<RespostasRetrato>) => setRespostas((r) => ({ ...r, ...patch }));

  // ------------------------------------------
  // Navegação
  // ------------------------------------------
  const temPecas = pecas.length > 0;

  async function concluirEntrevista(respostasFinais: RespostasRetrato) {
    setTela({ tipo: 'compondo' });
    let texto = '';
    try {
      const res = await fetch('/api/style-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: respostasFinais }),
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof json.texto === 'string') texto = json.texto;
      }
    } catch {
      // segue com o texto determinístico
    }
    if (!texto) texto = retratoDeterministico(respostasFinais);
    setRetrato(texto);

    const perfil = buildPerfil({ status: 'completed', respostas: respostasFinais, medidas, retrato: texto });
    const ok = await salvar(perfil);
    if (!ok) {
      setErroSalvar(() => () => {
        setErroSalvar(null);
        concluirEntrevista(respostasFinais);
      });
    } else {
      setStatus('completed');
    }
    setTela({ tipo: 'retrato' });
  }

  function avancar(etapa: number, r: RespostasRetrato) {
    if (etapa < TOTAL_PERGUNTAS) {
      setTela({ tipo: 'pergunta', etapa: etapa + 1 });
    } else if (etapa === TOTAL_PERGUNTAS && temPecas) {
      setTela({ tipo: 'pergunta', etapa: ETAPA_PECA });
    } else {
      concluirEntrevista(r);
    }
    window.scrollTo({ top: 0 });
  }

  function proxima(etapa: number) {
    avancar(etapa, respostas);
  }

  function pular(etapa: number) {
    const r = limparEtapa(etapa, respostas);
    if (etapa === 6) setMedidas({});
    setRespostas(r);
    avancar(etapa, r);
  }

  function voltar(etapa: number) {
    if (etapa === ETAPA_PECA) {
      setTela({ tipo: 'pergunta', etapa: TOTAL_PERGUNTAS });
    } else if (etapa > 1) {
      setTela({ tipo: 'pergunta', etapa: etapa - 1 });
    } else if (modoEditar || status === 'confirmed' || status === 'completed') {
      router.push('/estilo');
    } else if (iniciarDireto) {
      router.push('/estilo');
    } else {
      setTela({ tipo: 'intro' });
    }
    window.scrollTo({ top: 0 });
  }

  async function pularTudo() {
    setSalvando(true);
    const ok = await salvar(buildPerfil({ status: 'skipped', respostas: {} }));
    setSalvando(false);
    if (!ok) {
      setErroSalvar(() => () => {
        setErroSalvar(null);
        pularTudo();
      });
      return;
    }
    router.replace('/inicio');
  }

  async function confirmar() {
    setSalvando(true);
    const perfil = buildPerfil({ status: 'confirmed', respostas, medidas, retrato });
    const ok = await salvar(perfil, { onboarding_completo: true });
    setSalvando(false);
    if (!ok) {
      setErroSalvar(() => () => {
        setErroSalvar(null);
        confirmar();
      });
      return;
    }
    setStatus('confirmed');
    setTela({ tipo: 'final' });
  }

  // ------------------------------------------
  // Telas
  // ------------------------------------------
  if (tela.tipo === 'carregando') return <Loader />;
  if (tela.tipo === 'compondo') return <Loader texto="Compondo seu retrato…" />;

  if (tela.tipo === 'intro') {
    return (
      <div className="min-h-dvh flex flex-col px-6 pt-12 pb-10">
        <div className="flex items-center gap-2 mb-12">
          <span className="display italic text-2xl">Cabidê</span>
          <CabideMark size={20} color="#C6A15B" />
        </div>
        <p className="eyebrow mb-4">Retrato Cabidê</p>
        <p className="display italic text-xl text-muted mb-1">Antes de começarmos...</p>
        <h1 className="display text-[2.5rem] leading-tight mb-6">Queremos conhecer você.</h1>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground">
          <p>
            São apenas 3 minutos para contar ao Cabidê como é a sua rotina, o que você gosta e como quer se sentir ao se
            vestir.
          </p>
          <p>
            Essas informações ajudam o Cabidê a entender melhor o seu estilo e a criar looks que façam sentido para você e
            para a sua vida.
          </p>
          <p>Quanto mais conhecemos você, mais personalizados serão seus looks.</p>
        </div>
        <div className="rule-gold my-8" />
        <p className="text-[13px] text-muted mb-4">Leva cerca de 3 minutos.</p>
        <div className="mt-auto flex flex-col gap-3">
          <button type="button" onClick={() => setTela({ tipo: 'pergunta', etapa: 1 })} className="btn btn-primary w-full">
            Criar meu perfil de estilo
          </button>
          <button type="button" onClick={() => setTela({ tipo: 'confirmar_pular' })} className="btn btn-ghost w-full">
            Pular por enquanto
          </button>
        </div>
      </div>
    );
  }

  if (tela.tipo === 'confirmar_pular') {
    return (
      <div className="min-h-dvh flex flex-col px-6 pt-24 pb-10">
        <p className="eyebrow mb-4">Retrato Cabidê</p>
        <h1 className="display text-[2.25rem] leading-tight mb-6">Quer mesmo pular?</h1>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground">
          <p>
            Você pode começar a usar o Cabidê agora, mas sem essas informações teremos menos contexto para personalizar seus
            looks.
          </p>
          <p>Seu perfil de estilo ajuda o Cabidê a entender o que combina com você, sua rotina e seus objetivos.</p>
          <p>A entrevista leva apenas 3 minutos e você poderá atualizar suas respostas depois.</p>
        </div>
        {erroSalvar && <ErroSalvar onTentar={erroSalvar} />}
        <div className="mt-auto pt-10 flex flex-col gap-3">
          <button type="button" onClick={() => setTela({ tipo: 'pergunta', etapa: 1 })} className="btn btn-primary w-full">
            Criar meu perfil
          </button>
          <button type="button" onClick={pularTudo} disabled={salvando} className="btn btn-outline w-full">
            Pular e ir para o Cabidê
          </button>
        </div>
      </div>
    );
  }

  if (tela.tipo === 'retrato') {
    return (
      <div className="min-h-dvh flex flex-col px-6 pt-16 pb-10">
        <p className="eyebrow mb-4">Retrato Cabidê</p>
        <h1 className="display text-[2.5rem] leading-tight mb-8">Seu retrato de estilo</h1>
        <p className="display text-[1.35rem] leading-relaxed">{retrato}</p>
        <div className="rule-gold my-10" />
        {erroSalvar && <ErroSalvar onTentar={erroSalvar} />}
        <div className="mt-auto">
          <p className="display text-xl mb-5">Esse perfil combina com você?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setErroSalvar(null);
                setTela({ tipo: 'pergunta', etapa: 1 });
              }}
              className="btn btn-outline"
            >
              Editar meu perfil
            </button>
            <button type="button" onClick={confirmar} disabled={salvando || !!erroSalvar} className="btn btn-primary">
              Confirmar meu perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tela.tipo === 'final') {
    return (
      <div className="min-h-dvh flex flex-col px-6 pt-24 pb-10">
        <CabideMark size={30} color="#C6A15B" className="mb-8" />
        <h1 className="display text-[2.5rem] leading-tight mb-6">Seu estilo começa aqui.</h1>
        <div className="space-y-4 text-[15px] leading-relaxed text-foreground">
          <p>
            Agora o Cabidê conhece melhor você — o que você gosta, o que faz sentido para a sua rotina e como quer se sentir ao
            se vestir.
          </p>
          <p>A partir de agora, seus looks vão partir de quem você é, não apenas das roupas que estão no seu armário.</p>
        </div>
        <div className="mt-auto pt-10">
          <button type="button" onClick={() => router.push('/looks')} className="btn btn-primary w-full">
            Criar meu primeiro look
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // Perguntas
  // ------------------------------------------
  const etapa = tela.etapa;
  const shellProps = {
    etapa,
    onVoltar: () => voltar(etapa),
    onPular: () => pular(etapa),
    onProxima: () => proxima(etapa),
  };

  switch (etapa) {
    case 1: {
      const contextos = respostas.contextos ?? [];
      const cheio = contextos.length >= P1_MAX;
      const toggle = (c: Contexto) =>
        atualizar({ contextos: contextos.includes(c) ? contextos.filter((x) => x !== c) : [...contextos, c] });
      return (
        <StepShell
          {...shellProps}
          pergunta="Como é a sua semana, na maior parte do tempo?"
          instrucao="Escolha de 4 a 6 opções."
          proximaHabilitada={etapaValida(1, respostas)}
        >
          <div className="flex justify-end -mt-3 mb-2">
            <Contador atual={contextos.length} max={P1_MAX} />
          </div>
          <div className="space-y-6">
            {CONTEXTO_GRUPOS.map((g) => (
              <div key={g.titulo}>
                <p className="eyebrow mb-2">{g.titulo}</p>
                <div className="grid gap-2">
                  {g.opcoes.map((o) => (
                    <OptionButton
                      key={o.value}
                      selected={contextos.includes(o.value)}
                      disabled={cheio}
                      onClick={() => toggle(o.value)}
                    >
                      {o.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {contextos.includes('outro') && (
            <input
              type="text"
              value={respostas.contextos_outro ?? ''}
              onChange={(e) => atualizar({ contextos_outro: e.target.value })}
              placeholder="Conte qual é"
              maxLength={60}
              aria-label="Outro contexto"
              className="input mt-3"
            />
          )}
          {temContextoTrabalho(contextos) && (
            <>
              <SubPergunta>E como é o dress code do seu trabalho?</SubPergunta>
              <SingleSelect
                opcoes={DRESS_CODES}
                valor={respostas.dress_code}
                onChange={(v) => atualizar({ dress_code: v })}
              />
            </>
          )}
        </StepShell>
      );
    }

    case 2: {
      const v = respostas.estilo_atual ?? [];
      return (
        <StepShell
          {...shellProps}
          pergunta="Se alguém descrevesse como você se veste hoje, quais 3 palavras usaria?"
          instrucao="Escolha exatamente 3."
          proximaHabilitada={etapaValida(2, respostas)}
        >
          <div className="flex justify-end -mt-3 mb-2">
            <Contador atual={v.length} max={3} />
          </div>
          <MultiSelect opcoes={ESTILOS} valores={v} max={3} colunas={2} onChange={(x) => atualizar({ estilo_atual: x })} />
        </StepShell>
      );
    }

    case 3: {
      const v = respostas.estilo_desejado ?? [];
      return (
        <StepShell
          {...shellProps}
          pergunta="Como você gostaria de se vestir?"
          instrucao="Escolha até 3."
          proximaHabilitada={etapaValida(3, respostas)}
        >
          <div className="flex justify-end -mt-3 mb-2">
            <Contador atual={v.length} max={3} />
          </div>
          <MultiSelect opcoes={ESTILOS} valores={v} max={3} colunas={2} onChange={(x) => atualizar({ estilo_desejado: x })} />
        </StepShell>
      );
    }

    case 4:
      return (
        <StepShell
          {...shellProps}
          pergunta="Quando você entra em um lugar, o que gostaria que sua imagem transmitisse primeiro?"
          instrucao="Escolha 1."
          proximaHabilitada={etapaValida(4, respostas)}
        >
          <SingleSelect
            opcoes={INTENCOES}
            valor={respostas.intencao_imagem}
            onChange={(x) => atualizar({ intencao_imagem: x })}
          />
        </StepShell>
      );

    case 5:
      return (
        <StepShell
          {...shellProps}
          pergunta="Conforto"
          instrucao="De 1 a 5, quanto o conforto pesa nas suas escolhas."
          proximaHabilitada={etapaValida(5, respostas)}
        >
          <ScaleSelector
            nome="Conforto"
            valor={respostas.conforto}
            onChange={(x) => atualizar({ conforto: x })}
            rotuloMin="Pouco decisivo"
            rotuloMax="Indispensável"
          />
          <SubPergunta className="mt-12">Quanto você gosta de experimentar?</SubPergunta>
          <ScaleSelector
            nome="Quanto você gosta de experimentar"
            valor={respostas.ousadia}
            onChange={(x) => atualizar({ ousadia: x })}
            rotuloMin="Prefiro o conhecido"
            rotuloMax="Adoro experimentar"
          />
        </StepShell>
      );

    case 6: {
      const s = respostas.silhueta ?? {};
      const medidasPreenchidas = !!(medidas.tamanho_roupa?.trim() || medidas.tamanho_calcado);
      return (
        <StepShell
          {...shellProps}
          pergunta="Como você prefere que a roupa caia no seu corpo?"
          proximaHabilitada={etapaValida(6, respostas) || medidasPreenchidas}
        >
          <p className="eyebrow mb-2">Parte de cima</p>
          <SingleSelect
            opcoes={CAIMENTO_CIMA}
            valor={s.cima}
            colunas={2}
            onChange={(x) => atualizar({ silhueta: { ...s, cima: x } })}
          />
          <p className="eyebrow mb-2 mt-6">Parte de baixo</p>
          <SingleSelect
            opcoes={CAIMENTO_BAIXO}
            valor={s.baixo}
            colunas={2}
            onChange={(x) => atualizar({ silhueta: { ...s, baixo: x } })}
          />
          <p className="eyebrow mb-2 mt-6">Comprimentos</p>
          <MultiSelect
            opcoes={COMPRIMENTOS}
            valores={s.comprimentos ?? []}
            onChange={(x) => atualizar({ silhueta: { ...s, comprimentos: x } })}
          />
          <SizeFields medidas={medidas} onChange={setMedidas} />
        </StepShell>
      );
    }

    case 7: {
      const cores = respostas.cores_veto ?? [];
      const outraAtiva = respostas.cores_veto_outra !== undefined;
      return (
        <StepShell
          {...shellProps}
          pergunta="Quais famílias de cores você mais gosta de usar?"
          proximaHabilitada={etapaValida(7, respostas)}
        >
          <MultiSelect opcoes={PALETAS} valores={respostas.paletas ?? []} onChange={(x) => atualizar({ paletas: x })} />
          <SubPergunta>E como você se sente em relação às estampas?</SubPergunta>
          <SingleSelect opcoes={ESTAMPAS} valor={respostas.estampas} onChange={(x) => atualizar({ estampas: x })} />
          <SubPergunta>Existe alguma cor que você evita usar?</SubPergunta>
          <MultiSelect
            opcoes={CORES_VETO}
            valores={cores}
            colunas={2}
            onChange={(x) => atualizar({ cores_veto: x })}
          />
          <div className="mt-2">
            <OptionButton
              selected={outraAtiva}
              onClick={() => {
                if (outraAtiva) {
                  setRespostas((r) => {
                    const n = { ...r };
                    delete n.cores_veto_outra;
                    return n;
                  });
                } else {
                  atualizar({ cores_veto_outra: '' });
                }
              }}
            >
              Outra
            </OptionButton>
            {outraAtiva && (
              <input
                type="text"
                value={respostas.cores_veto_outra ?? ''}
                onChange={(e) => atualizar({ cores_veto_outra: e.target.value })}
                placeholder="Qual cor?"
                maxLength={40}
                aria-label="Outra cor que evita"
                className="input mt-2"
              />
            )}
          </div>
        </StepShell>
      );
    }

    case 8: {
      const outraAtiva = respostas.vetos_outra !== undefined;
      return (
        <StepShell
          {...shellProps}
          pergunta="O que você não usa de jeito nenhum?"
          proximaHabilitada={etapaValida(8, respostas)}
        >
          <MultiSelect opcoes={VETOS} valores={respostas.vetos ?? []} onChange={(x) => atualizar({ vetos: x })} />
          <div className="mt-2">
            <OptionButton
              selected={outraAtiva}
              onClick={() => {
                if (outraAtiva) {
                  setRespostas((r) => {
                    const n = { ...r };
                    delete n.vetos_outra;
                    return n;
                  });
                } else {
                  atualizar({ vetos_outra: '' });
                }
              }}
            >
              Outra
            </OptionButton>
            {outraAtiva && (
              <input
                type="text"
                value={respostas.vetos_outra ?? ''}
                onChange={(e) => atualizar({ vetos_outra: e.target.value })}
                placeholder="O que mais você não usa?"
                maxLength={80}
                aria-label="Outra peça que não usa"
                className="input mt-2"
              />
            )}
          </div>
          <SubPergunta>Quando você abre seu armário, o que mais acontece?</SubPergunta>
          <SingleSelect opcoes={DORES} valor={respostas.dor_principal} onChange={(x) => atualizar({ dor_principal: x })} />
        </StepShell>
      );
    }

    case 9: {
      const v = respostas.estado_desejado ?? [];
      return (
        <StepShell
          {...shellProps}
          pergunta="E quando você se veste, como gostaria de se sentir?"
          instrucao="Escolha até 3."
          proximaHabilitada={etapaValida(9, respostas)}
          proximaLabel={temPecas ? 'Próxima' : 'Ver meu retrato'}
        >
          <div className="flex justify-end -mt-3 mb-2">
            <Contador atual={v.length} max={3} />
          </div>
          <MultiSelect
            opcoes={SENTIMENTOS}
            valores={v}
            max={3}
            colunas={2}
            onChange={(x) => atualizar({ estado_desejado: x })}
          />
        </StepShell>
      );
    }

    case ETAPA_PECA:
      return (
        <StepShell
          {...shellProps}
          opcional
          pergunta="Qual peça do seu armário mais tem a sua cara?"
          instrucao="Opcional. Escolha uma peça."
          proximaHabilitada={!!respostas.pecas_ancora?.length}
          proximaLabel="Ver meu retrato"
        >
          <PiecePicker
            pecas={pecas}
            selecionada={respostas.pecas_ancora?.[0]}
            onChange={(id) => atualizar({ pecas_ancora: id ? [id] : undefined })}
          />
        </StepShell>
      );

    default:
      return null;
  }
}

export default function RetratoPage() {
  return (
    <Suspense fallback={<Loader />}>
      <RetratoFlow />
    </Suspense>
  );
}
