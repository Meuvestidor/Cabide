import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MODEL_LOOKS } from '@/lib/models';
import { buildLooksPrompt } from '@/lib/prompts';
import { createServerSupabase } from '@/lib/supabase-server';
import { perfilAtivo } from '@/lib/retrato';
import {
  aplicarFiltrosDuros,
  atributosDaPeca,
  buildComportamentoRules,
  buildPerfilRules,
  formalidadeAlvo as calcularFormalidade,
  sinaisDaPeca,
  sinaisDeComportamento,
  type LookHistorico,
  type PecaEntrada,
  type RegistroUsoHistorico,
  type SinaisComportamento,
} from '@/lib/perfil-looks';
import {
  LEGENDA_PECAS,
  compactarPecas,
  filtrarPorContexto,
  formalidadeDoLook,
  limitarPorCategoria,
  type ContextoEmbudo,
} from '@/lib/embudo-looks';
import {
  FAIXA_LABEL,
  buscarClimaDia,
  climaInformado,
  normalizarAjuste,
  pedeCamada,
  resumoClima,
  type ClimaDia,
} from '@/lib/clima';
import type { LookTipo, PerfilEstilo } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Nomes do produto (prompt) -> códigos internos gravados em looks.tipo.
const TIPO_PARA_CODIGO: Record<string, LookTipo> = {
  essencial: 'safe',
  autoral: 'cool',
  ousado: 'risky',
  // tolera respostas no formato antigo
  safe: 'safe',
  cool: 'cool',
  risky: 'risky',
};

type LookGerado = {
  tipo: string;
  pecas: string[];
  por_que_funciona: string;
  formalidade_resultante: number;
  grupo_id?: string;
  ocasiao?: string;
  formalidade_alvo?: number;
  clima_temp?: number | null;
  clima_condicao?: string | null;
};

// Erros são devolvidos com um "code" para a interface traduzir em mensagem humana.
function erro(code: string, status: number) {
  return NextResponse.json({ error: true, code }, { status });
}

/** Data de hoje (AAAA-MM-DD) no fuso do Brasil. */
function hojeBrasil(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export async function POST(req: NextRequest) {
  try {
    const { ocasiao, temperatura, condicaoClima, perfilEstilo, pecas, pecasFixadas, ajusteClima } = await req.json();

    if (!ocasiao || !pecas || pecas.length === 0) {
      return erro('DADOS_INVALIDOS', 400);
    }

    // ------------------------------------------
    // Perfil e comportamento: lidos no servidor (sessão).
    // Somente um Retrato 'confirmed' ativa a personalização.
    // ------------------------------------------
    let perfil: PerfilEstilo | null = null;
    let comportamento: SinaisComportamento | null = null;
    let cidade: string | null = null;
    const pecasEntrada = pecas as PecaEntrada[];

    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, looksRes, registrosRes] = await Promise.all([
          supabase.from('profiles').select('perfil_estilo, cidade').eq('id', user.id).maybeSingle(),
          supabase
            .from('looks')
            .select('id, tipo, pecas, decisao, grupo_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200),
          supabase
            .from('registros_uso')
            .select('pecas, como_me_senti')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200),
        ]);
        perfil = perfilAtivo(profileRes.data?.perfil_estilo);
        cidade = typeof profileRes.data?.cidade === 'string' && profileRes.data.cidade.trim() ? profileRes.data.cidade : null;
        comportamento = sinaisDeComportamento(
          (looksRes.data as LookHistorico[]) ?? [],
          (registrosRes.data as RegistroUsoHistorico[]) ?? [],
          pecasEntrada
        );
      } else {
        perfil = perfilAtivo(perfilEstilo);
      }
    } catch (e) {
      console.error('Looks API: falha ao ler perfil/comportamento; seguindo sem personalização.', e);
      perfil = perfilAtivo(perfilEstilo);
    }

    // ------------------------------------------
    // Clima do dia: previsão das próximas 12 h para a cidade do perfil.
    // Reserva: a temperatura que o aparelho mostrou. Nunca um clima inventado.
    // ------------------------------------------
    const ajuste = normalizarAjuste(ajusteClima);
    let clima: ClimaDia | null = cidade ? await buscarClimaDia(cidade, ajuste) : null;
    if (!clima && typeof temperatura === 'number' && Number.isFinite(temperatura)) {
      clima = climaInformado(temperatura, typeof condicaoClima === 'string' ? condicaoClima : null, ajuste);
    }

    // ------------------------------------------
    // Camada A — filtros duros ANTES do modelo
    // ------------------------------------------
    const filtro = aplicarFiltrosDuros(pecasEntrada, perfil, Array.isArray(pecasFixadas) ? pecasFixadas : []);
    const aptas = filtro.aptas;

    // Filtros esvaziaram o armário para esta combinação → 422 interno (mensagem humana na UI)
    const tinhaCalcado = pecasEntrada.some((p) => p.categoria === 'calcado');
    const temCalcado = aptas.some((p) => p.categoria === 'calcado');
    if ((tinhaCalcado && !temCalcado) || (pecasEntrada.length >= 3 && aptas.length < 3)) {
      return erro('POUCAS_PECAS', 422);
    }

    const formalidade = calcularFormalidade(ocasiao, perfil);

    // ------------------------------------------
    // Embudo — clima, ocasião, formalidade, uso recente e limite por categoria.
    // O modelo recebe no máximo ~25 peças, qualquer que seja o tamanho do armário.
    // ------------------------------------------
    const ctx: ContextoEmbudo = { ocasiao, formalidadeAlvo: formalidade, clima, hoje: hojeBrasil(), fixadas: filtro.fixadas };
    const { candidatas, nivel } = filtrarPorContexto(aptas, ctx);

    const sinaisPorPeca = new Map(candidatas.map((p) => [p.id, sinaisDaPeca(p, perfil, comportamento)]));
    const enviadas = limitarPorCategoria(candidatas, sinaisPorPeca, ctx);
    const atributosPorPeca = new Map(enviadas.map((p) => [p.id, atributosDaPeca(p)]));
    const compactas = compactarPecas(enviadas, atributosPorPeca, sinaisPorPeca);

    const nomes = new Map(pecasEntrada.map((p) => [p.id, p.nome]));
    const prompt = buildLooksPrompt({
      ocasiao,
      formalidadeAlvo: formalidade,
      clima: clima ? resumoClima(clima) : null,
      pedeCamada: clima ? pedeCamada(clima) : false,
      chuva: clima?.chuva != null && clima.chuva >= 60,
      regrasPerfil: perfil ? buildPerfilRules(perfil, comportamento) : null,
      regrasComportamento: buildComportamentoRules(comportamento, nomes),
      legenda: LEGENDA_PECAS,
      pecas: compactas.texto,
      pecasFixadas: filtro.fixadas.map((id) => compactas.paraCurto.get(id)).filter((id): id is string => !!id),
    });

    const message = await anthropic.messages.create({
      model: MODEL_LOOKS,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Medição de custo real por geração (aparece nos logs da Vercel).
    console.info('[looks] uso', {
      modelo: MODEL_LOOKS,
      tokens_entrada: message.usage.input_tokens,
      tokens_saida: message.usage.output_tokens,
      pecas_armario: pecasEntrada.length,
      pecas_enviadas: enviadas.length,
      nivel_embudo: nivel,
      clima: clima ? `${clima.fonte}:${Math.round(clima.min)}-${Math.round(clima.max)}` : 'desconhecido',
    });

    // Junta todos os blocos de texto (robusto a respostas com mais de um bloco)
    const responseText = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');

    // Parse JSON — try code fence first, then raw
    let jsonStr: string | null = null;
    const fenceMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    } else {
      const rawMatch = responseText.match(/\{[\s\S]*\}/);
      if (rawMatch) jsonStr = rawMatch[0];
    }

    if (!jsonStr) {
      console.error('Looks API: resposta sem JSON.', responseText.slice(0, 500));
      return erro('GERACAO_FALHOU', 502);
    }

    const looksData = JSON.parse(jsonStr) as { looks?: LookGerado[] };
    if (!Array.isArray(looksData.looks)) {
      return erro('GERACAO_FALHOU', 502);
    }

    // Generate a grupo_id to link the 3 looks from this request
    const grupoId = crypto.randomUUID();

    // ------------------------------------------
    // Segunda barreira: ids curtos → ids reais, e só peças aptas
    // (existentes E dentro dos limites). Um veto nunca volta.
    // ------------------------------------------
    const idsAptos = new Set(aptas.map((p) => p.id));
    const pecasPorId = new Map(pecasEntrada.map((p) => [p.id, p]));
    const paraReal = (id: string) => compactas.paraReal.get(id.trim().toLowerCase()) ?? id;
    const avisos = [...filtro.avisos];
    if (nivel === 2) {
      avisos.push('Seu armário ainda tem poucas peças para este clima e esta ocasião; montamos o melhor possível com o que há.');
    }
    const tiposVistos = new Set<LookTipo>();
    const looks: LookGerado[] = [];

    for (const look of looksData.looks) {
      const codigo = TIPO_PARA_CODIGO[String(look.tipo ?? '').toLowerCase()];
      if (!codigo || tiposVistos.has(codigo)) continue;

      const recebidas = Array.isArray(look.pecas) ? look.pecas.map((id) => paraReal(String(id))) : [];
      const pecasValidas = Array.from(new Set(recebidas.filter((id) => idsAptos.has(id))));
      if (pecasValidas.length !== recebidas.length) {
        console.warn(`Look ${codigo}: peças removidas pela validação`, recebidas.filter((id) => !idsAptos.has(id)));
        if (!avisos.includes('Ajustamos um dos looks para respeitar o seu armário e os seus limites.')) {
          avisos.push('Ajustamos um dos looks para respeitar o seu armário e os seus limites.');
        }
      }
      if (pecasValidas.length === 0) continue;

      tiposVistos.add(codigo);
      looks.push({
        tipo: codigo,
        pecas: pecasValidas,
        por_que_funciona: String(look.por_que_funciona ?? ''),
        formalidade_resultante: formalidadeDoLook(pecasValidas, pecasPorId, formalidade),
        grupo_id: grupoId,
        ocasiao,
        formalidade_alvo: formalidade,
        clima_temp: clima?.agora ?? (typeof temperatura === 'number' ? temperatura : null),
        clima_condicao: clima?.descricao || (typeof condicaoClima === 'string' ? condicaoClima : null) || null,
      });
    }

    if (looks.length === 0) {
      return erro('GERACAO_FALHOU', 502);
    }

    return NextResponse.json({
      data: {
        looks,
        avisos,
        clima: clima
          ? {
              resumo: resumoClima(clima),
              faixa: FAIXA_LABEL[clima.faixa],
              min: Math.round(clima.min),
              max: Math.round(clima.max),
              ajuste: clima.ajuste,
              fonte: clima.fonte,
              cidade: clima.cidade,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Looks API: erro do modelo ${error.status}:`, error.message);
    } else {
      console.error('Looks API error:', error);
    }
    return erro('GERACAO_FALHOU', 500);
  }
}
