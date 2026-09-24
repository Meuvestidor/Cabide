// ============================================
// CABIDÊ — Claude API Prompts
// Based on PRD sections 8, 10, 11, 12
// ============================================

export const CATALOG_PROMPT = `Você é a estilista pessoal do Cabidê. Analise esta foto de uma peça de roupa e extraia os seguintes atributos em JSON.

REGRAS CRÍTICAS:
- Se não conseguir identificar um atributo com segurança, coloque "?" no campo e adicione a dúvida no campo "duvidas".
- Melhor confirmar do que preencher incorretamente.
- A marca só pode ser cadastrada se estiver visível na foto.
- Nunca invente informações.
- Os campos "estampa", "salto", "caimento", "detalhes" e "tamanho" só podem ser preenchidos com evidência visual clara; sem evidência, use null (ou [] em "detalhes"). Nunca use "?" nesses campos.
- TAMANHO: registre somente o que estiver escrito numa etiqueta claramente visível e legível na foto (ex.: "M", "38"). Se a etiqueta não aparecer ou não for legível, "tamanho" é null. NUNCA estime o tamanho pelo aspecto da peça.

Retorne SOMENTE um JSON válido com esta estrutura:
{
  "nome": "descrição curta da peça (ex: blazer de lã cinza chumbo)",
  "categoria": "parte_de_cima | parte_de_baixo | vestido | macacao | casaco | calcado | bolsa | acessorio | joias | roupa_intima | praia | esporte | outros",
  "subcategoria": "tipo específico (ex: blazer, camiseta, calça jeans, saia midi, tênis...)",
  "cor": "cor principal em português",
  "hex": "#código hex aproximado da cor principal",
  "formalidade": número de 1 a 5 (1=casual, 2=smart casual, 3=business casual, 4=arrumada, 5=formal),
  "protagonismo": número de 1 a 5 (1=básica, 2=discreta, 3=moderada, 4=destaque, 5=protagonista),
  "temporadas": ["primavera_verao" e/ou "outono_inverno" e/ou "todas"],
  "temperatura_min": número (temperatura mínima adequada em °C),
  "temperatura_max": número (temperatura máxima adequada em °C),
  "ocasioes": ["trabalho", "reuniao", "networking", "palestra", "evento", "casual", "gravacao", "viagem", "encontro"],
  "estilos": até 3 itens, SOMENTE desta lista: ["clássico", "minimalista", "elegante", "moderno", "romântico", "descontraído", "criativo", "sofisticado", "natural", "marcante", "esportivo", "boêmio"],
  "estado": "novo | bom | usado | desgastado",
  "comprimento": "curto | médio | longo | midi | mini | maxi | null",
  "material": "material identificado ou null",
  "marca": "marca visível ou null",
  "estampa": "lisa | discreta | chamativa | null",
  "salto": "sem | baixo | medio | alto — somente para calçados; null para as demais peças",
  "caimento": "ajustado | reto | amplo | null",
  "detalhes": lista com os que forem visíveis entre ["decote_profundo", "transparencia", "cropped", "amassa_facil", "expoe_pele", "curta"], ou [],
  "tamanho": "texto da etiqueta, somente se claramente visível; senão null",
  "duvidas": "dúvidas sobre a peça ou null"
}`;

export function buildLooksPrompt(params: {
  ocasiao: string;
  temperatura: number | null;
  condicaoClima: string | null;
  formalidadeAlvo: number;
  /** Regras do Retrato Cabidê confirmado (camadas B e C). null = sem perfil confirmado. */
  regrasPerfil: string | null;
  /** Regras gerais aprendidas do comportamento (pode ser vazio). */
  regrasComportamento: string;
  pecasDisponiveis: Array<Record<string, unknown>>;
  pecasFixadas?: string[];
}): string {
  const {
    ocasiao,
    temperatura,
    condicaoClima,
    formalidadeAlvo,
    regrasPerfil,
    regrasComportamento,
    pecasDisponiveis,
    pecasFixadas,
  } = params;

  return `Você é a estilista pessoal do Cabidê. Monte 3 looks para a usuária, um para cada caminho: ESSENCIAL, AUTORAL e OUSADO.

## SITUAÇÃO
- Ocasião: ${ocasiao}
- Formalidade alvo: ${formalidadeAlvo} (1=casual, 2=smart casual, 3=business casual, 4=arrumada, 5=formal)
${temperatura !== null ? `- Temperatura: ${temperatura}°C` : ''}
${condicaoClima ? `- Condição do tempo: ${condicaoClima}` : ''}

${pecasFixadas && pecasFixadas.length > 0 ? `## PEÇAS FIXADAS (OBRIGATÓRIAS)
A usuária quer usar estas peças. Elas DEVEM aparecer em TODOS os 3 looks:
IDs fixados: ${JSON.stringify(pecasFixadas)}
Monte os looks INCLUINDO essas peças obrigatoriamente.
` : ''}
${regrasPerfil ?? `## CAMINHOS (sem perfil de estilo confirmado — use critérios gerais de estilo)
Os três caminhos não são um ranking; nenhum é melhor que o outro.
- ESSENCIAL: "Você, como já se veste." Combinação segura e coerente com o que ela costuma usar (peças mais usadas).
- AUTORAL: "Você + uma nova possibilidade." Mantém a essência e introduz uma combinação, proporção ou peça diferente.
- OUSADO: "Uma versão mais experimental de você." Sai da zona de conforto, mas precisa ser utilizável e adequado à ocasião e ao clima.`}
${regrasComportamento ? `
## APRENDIZADOS DO USO REAL
${regrasComportamento}
` : ''}
## PEÇAS DISPONÍVEIS NO ARMÁRIO
Os limites da usuária (vetos, cores evitadas, incompatibilidades de conforto) JÁ FORAM APLICADOS: estas são as únicas peças permitidas. NUNCA reintroduza peças fora desta lista, em nenhum dos caminhos.

Campo "sinais" de cada peça:
- confianca: peça muito usada, segura para ESSENCIAL
- redescobrir: peça pouco usada, boa candidata a ganhar vida nova
- peca_querida: ela amou usar esta peça
- ancora: peça que ela considera "a cara dela"
- penalizada_feedback: esteve em looks que ela rejeitou — use só se for claramente a melhor opção
- penalidade_salto_alto / penalidade_rigida: conforto é prioridade para ela — evite
- penalidade_caimento / possible_caimento_amplo: a peça pode ficar mais folgada do que ela prefere — evite como peça principal
- possible_caimento_pequeno / possible_numeracao_diferente: pode não servir bem — prefira alternativas
Esses sinais são sobre a peça, nunca sobre o corpo dela: não os mencione na explicação.

${JSON.stringify(pecasDisponiveis, null, 2)}

## PROCEDIMENTO OBRIGATÓRIO (PRD seção 10)

### Passo 1 — Consultar o armário
Use SOMENTE as peças listadas acima. NUNCA invente peças.

### Passo 2 — Aplicar filtros
Elimine:
- Peças indisponíveis (disponivel = false)
- Peças fora da temperatura atual
- Peças inadequadas para a ocasião
- Peças com formalidade incompatível (diferença > 1.5 pontos da formalidade alvo)
- Peças usadas nos últimos 3 dias (ultima_utilizacao)
- Peças com dúvidas não resolvidas

### Passo 3 — Criar universo válido
Liste mentalmente as peças que sobreviveram aos filtros.

### Passo 4 — Compor 3 looks
Usando SOMENTE peças do universo válido: um ESSENCIAL, um AUTORAL e um OUSADO, seguindo as regras acima.

### Passo 5 — Verificar
Antes de apresentar, verifique CADA peça de CADA look:
- Ela existe na lista acima? (verificar ID)
- Ela está disponível?
- Ela é adequada para a temperatura?
- Ela é adequada para a ocasião?

## REGRAS DE QUALIDADE (PRD seção 12)
- Cor: neutro + cor é seguro. Dois saturados exigem hierarquia.
- Proporção: considerar volume, comprimento, relação superior/inferior.
- Protagonismo: SOMENTE UMA peça protagonista por look. Se protagonismo=5, as demais devem ser 1-2.
- Formalidade: máximo 1.5 ponto de diferença entre peças do look.
- Peças pouco utilizadas: sempre que possível, recuperar peças esquecidas.
- Calçado: OBRIGATÓRIO em cada look.
- Bolsas e joias: adicionar quando melhorarem a composição.
- Os 3 looks NÃO devem repetir a mesma peça protagonista.

## REGRA DE OURO
Nunca julgar o corpo. Pode falar sobre proporção, comprimento, volume, corte, cor, combinação, formalidade. NUNCA sobre tipo de corpo, tamanho ou peso.
Em "por_que_funciona", escreva em português natural, em segunda pessoa, sem mencionar tecnologia, inteligência artificial ou os nomes internos dos sinais.

## FORMATO DE RESPOSTA
Retorne SOMENTE um JSON válido:
{
  "looks": [
    {
      "tipo": "essencial",
      "pecas": ["id-da-peca-1", "id-da-peca-2", ...],
      "por_que_funciona": "explicação em português natural de por que este look funciona para você e para a ocasião",
      "formalidade_resultante": número
    },
    {
      "tipo": "autoral",
      "pecas": ["id-da-peca-1", "id-da-peca-2", ...],
      "por_que_funciona": "explicação",
      "formalidade_resultante": número
    },
    {
      "tipo": "ousado",
      "pecas": ["id-da-peca-1", "id-da-peca-2", ...],
      "por_que_funciona": "explicação",
      "formalidade_resultante": número
    }
  ]
}`;
}

// ============================================
// RETRATO CABIDÊ — texto editorial "Seu retrato de estilo"
// Recebe SOMENTE atributos estruturados já rotulados (sem tamanhos).
// ============================================
export function buildStylePortraitPrompt(atributos: {
  estilo_atual: string[];
  estilo_desejado: string[];
  intencao_imagem: string | null;
  estado_desejado: string[];
  contextos: string[];
  conforto: number | null;
  ousadia: number | null;
  paletas: string[];
  dor_principal: string | null;
}): string {
  const linhas: string[] = [];
  if (atributos.estilo_atual.length) linhas.push(`- Estilo hoje (como se veste): ${atributos.estilo_atual.join(', ')}`);
  if (atributos.estilo_desejado.length) linhas.push(`- Como quer se vestir (direção desejada): ${atributos.estilo_desejado.join(', ')}`);
  if (atributos.intencao_imagem) linhas.push(`- O que quer transmitir aos outros: ${atributos.intencao_imagem}`);
  if (atributos.estado_desejado.length) linhas.push(`- Como quer se sentir ao se vestir: ${atributos.estado_desejado.join(', ')}`);
  if (atributos.contextos.length) linhas.push(`- Rotina: ${atributos.contextos.join(', ')}`);
  if (atributos.conforto) linhas.push(`- Importância do conforto: ${atributos.conforto} de 5`);
  if (atributos.ousadia) linhas.push(`- Gosto por experimentar: ${atributos.ousadia} de 5`);
  if (atributos.paletas.length) linhas.push(`- Famílias de cores preferidas: ${atributos.paletas.join(', ')}`);
  if (atributos.dor_principal) linhas.push(`- Ao abrir o armário: ${atributos.dor_principal}`);

  return `Você escreve para o Cabidê, uma marca de moda e estilo pessoal. Escreva o texto "Seu retrato de estilo" para esta usuária.

ATRIBUTOS (use somente estes; não invente nada além deles):
${linhas.join('\n')}

REGRAS:
- Entre 60 e 90 palavras, em português do Brasil, em segunda pessoa ("você").
- Tom editorial de revista de moda: caloroso, elegante, humano, sem exageros nem clichês.
- Um único parágrafo corrido, sem título, sem listas, sem aspas, sem emojis.
- Diferencie claramente o que ela quer transmitir aos outros e como ela quer se sentir; não misture os dois.
- Diferencie o estilo de hoje da direção desejada.
- Não mencione tamanho, medidas, corpo, formato de corpo, peso ou aparência física.
- Não mencione tecnologia, inteligência artificial, algoritmos ou o próprio texto.
- Não cite números de escalas; traduza-os em linguagem natural.

Responda apenas com o parágrafo.`;
}
