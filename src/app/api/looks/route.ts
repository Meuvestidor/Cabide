import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildLooksPrompt } from '@/lib/prompts';
import { createServerSupabase } from '@/lib/supabase-server';
import { ESTILO_LABEL_PECA, perfilAtivo } from '@/lib/retrato';
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

export async function POST(req: NextRequest) {
  try {
    const { ocasiao, temperatura, condicaoClima, perfilEstilo, pecas, pecasFixadas } = await req.json();

    if (!ocasiao || !pecas || pecas.length === 0) {
      return erro('DADOS_INVALIDOS', 400);
    }

    // ------------------------------------------
    // Perfil e comportamento: lidos no servidor (sessão).
    // Somente um Retrato 'confirmed' ativa a personalização.
    // ------------------------------------------
    let perfil: PerfilEstilo | null = null;
    let comportamento: SinaisComportamento | null = null;
    const pecasEntrada = pecas as PecaEntrada[];

    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, looksRes, registrosRes] = await Promise.all([
          supabase.from('profiles').select('perfil_estilo').eq('id', user.id).maybeSingle(),
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

    // Peças enviadas ao modelo: sem ficha bruta e sem tamanho (o sinal já está calculado)
    const pecasParaModelo = aptas.map((p) => {
      const a = atributosDaPeca(p);
      const sinais = sinaisDaPeca(p, perfil, comportamento);
      return {
        id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        subcategoria: p.subcategoria,
        cor: p.cor,
        formalidade: p.formalidade,
        protagonismo: p.protagonismo,
        temporadas: p.temporadas,
        temperatura_min: p.temperatura_min,
        temperatura_max: p.temperatura_max,
        ocasioes: p.ocasioes,
        estilos: a.estilos.length ? a.estilos.map((e) => ESTILO_LABEL_PECA[e]) : p.estilos,
        estado: p.estado,
        comprimento: p.comprimento,
        material: p.material,
        disponivel: p.disponivel,
        vezes_usada: p.vezes_usada,
        ultima_utilizacao: p.ultima_utilizacao,
        ...(a.estampa ? { estampa: a.estampa } : {}),
        ...(a.caimento ? { caimento: a.caimento } : {}),
        ...(p.como_me_queda ? { como_me_queda: p.como_me_queda } : {}),
        ...(sinais.length ? { sinais } : {}),
      };
    });

    const nomes = new Map(pecasEntrada.map((p) => [p.id, p.nome]));
    const prompt = buildLooksPrompt({
      ocasiao,
      temperatura: temperatura ?? null,
      condicaoClima: condicaoClima ?? null,
      formalidadeAlvo: formalidade,
      regrasPerfil: perfil ? buildPerfilRules(perfil, comportamento) : null,
      regrasComportamento: buildComportamentoRules(comportamento, nomes),
      pecasDisponiveis: pecasParaModelo,
      pecasFixadas: filtro.fixadas,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

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
    // Segunda barreira: só peças aptas (existentes E dentro dos limites).
    // Um veto nunca volta, nem se o modelo tentar reintroduzi-lo.
    // ------------------------------------------
    const idsAptos = new Set(aptas.map((p) => p.id));
    const avisos = [...filtro.avisos];
    const tiposVistos = new Set<LookTipo>();
    const looks: LookGerado[] = [];

    for (const look of looksData.looks) {
      const codigo = TIPO_PARA_CODIGO[String(look.tipo ?? '').toLowerCase()];
      if (!codigo || tiposVistos.has(codigo)) continue;

      const pecasValidas = (Array.isArray(look.pecas) ? look.pecas : []).filter((id) => idsAptos.has(id));
      if (pecasValidas.length !== (look.pecas?.length ?? 0)) {
        console.warn(`Look ${codigo}: peças removidas pela validação`, look.pecas?.filter((id) => !idsAptos.has(id)));
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
        formalidade_resultante: Number(look.formalidade_resultante) || formalidade,
        grupo_id: grupoId,
        ocasiao,
        formalidade_alvo: formalidade,
        clima_temp: temperatura || null,
        clima_condicao: condicaoClima || null,
      });
    }

    if (looks.length === 0) {
      return erro('GERACAO_FALHOU', 502);
    }

    return NextResponse.json({ data: { looks, avisos } });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Looks API: erro do modelo ${error.status}:`, error.message);
    } else {
      console.error('Looks API error:', error);
    }
    return erro('GERACAO_FALHOU', 500);
  }
}
