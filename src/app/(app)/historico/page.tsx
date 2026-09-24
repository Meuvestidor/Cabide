"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import {
  Shirt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OCASIOES, LOOK_TIPOS } from "@/lib/constants";
import { HangerIcon } from "@/components/icons";
import type { LookTipo } from "@/types/database";

interface LookRow {
  id: string;
  tipo: LookTipo;
  pecas: string[];
  decisao: string | null;
  por_que_funciona: string;
  clima_temp: number | null;
  clima_condicao: string | null;
  ocasiao: string;
  formalidade_alvo: number;
  data: string;
  grupo_id: string | null;
  created_at: string;
}

interface PecaMin {
  id: string;
  nome: string;
  categoria: string;
  cor: string;
  imagem_url: string;
}

const DECISAO_LABELS: Record<string, string> = {
  usei: "Usei",
  nao_usei: "Não usei",
  nao_gostei: "Não gostei",
};

function DecisaoTag({ decisao }: { decisao: string | null }) {
  if (!decisao || !DECISAO_LABELS[decisao]) return null;
  return <span className="chip text-[11px] py-0.5">{DECISAO_LABELS[decisao]}</span>;
}

function LookHistoryCard({
  look,
  pecasMap,
}: {
  look: LookRow;
  pecasMap: Map<string, PecaMin>;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = LOOK_TIPOS[look.tipo];
  const lookPecas = look.pecas
    .map((id) => pecasMap.get(id))
    .filter(Boolean) as PecaMin[];

  const date = new Date(look.data || look.created_at).toLocaleDateString(
    "pt-BR",
    { day: "numeric", month: "short" }
  );

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-foreground">
              {info?.nome || look.tipo}
            </span>
            <DecisaoTag decisao={look.decisao} />
          </div>
          <p className="text-xs text-muted mt-0.5">
            {OCASIOES[look.ocasiao as keyof typeof OCASIOES] || look.ocasiao} ·{" "}
            {date}
            {look.clima_temp != null && ` · ${look.clima_temp}°C`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="pb-5">
          {/* Piece thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {lookPecas.map((p) => (
              <div
                key={p.id}
                className="flex-shrink-0 w-16 h-[84px] rounded-[2px] overflow-hidden bg-surface-alt"
              >
                {p.imagem_url ? (
                  <img
                    src={p.imagem_url}
                    alt={p.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt size={20} className="text-muted" />
                  </div>
                )}
              </div>
            ))}
            {lookPecas.length === 0 && (
              <p className="text-xs text-muted">Peças não disponíveis</p>
            )}
          </div>

          {/* Piece names */}
          <div className="flex flex-wrap gap-1 mt-2">
            {lookPecas.map((p) => (
              <span
                key={p.id}
                className="chip text-[11px] py-0.5"
              >
                {p.nome}
              </span>
            ))}
          </div>

          {/* Explanation */}
          <p className="text-sm text-foreground mt-3 leading-relaxed">
            {look.por_que_funciona}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HistoricoPage() {
  const [looks, setLooks] = useState<LookRow[]>([]);
  const [pecasMap, setPecasMap] = useState<Map<string, PecaMin>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load looks
      const { data: looksData } = await supabase
        .from("looks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (looksData) {
        setLooks(looksData as LookRow[]);

        // Collect all piece IDs
        const allPecaIds = new Set<string>();
        for (const look of looksData) {
          for (const pid of (look as LookRow).pecas) {
            allPecaIds.add(pid);
          }
        }

        // Load minimal piece data
        if (allPecaIds.size > 0) {
          const { data: pecasData } = await supabase
            .from("pecas")
            .select("id,nome,categoria,cor,imagem_url")
            .in("id", Array.from(allPecaIds));

          if (pecasData) {
            const map = new Map<string, PecaMin>();
            for (const p of pecasData) {
              map.set(p.id, p as PecaMin);
            }
            setPecasMap(map);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  const filteredLooks =
    filter === "todas"
      ? looks
      : filter === "usei"
      ? looks.filter((l) => l.decisao === "usei")
      : filter === "sem_decisao"
      ? looks.filter((l) => !l.decisao)
      : looks;

  const groupByDate = (items: LookRow[]) => {
    const groups: Record<string, LookRow[]> = {};
    for (const look of items) {
      const date = look.data || look.created_at.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(look);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const grouped = groupByDate(filteredLooks);

  return (
    <div className="pt-8 pb-4">
      <h1 className="display text-[2.25rem] mb-1">Meus looks</h1>
      <p className="text-muted text-[13px] mb-6">
        {looks.length} {looks.length === 1 ? "look criado" : "looks criados"}
      </p>

      {/* Filter chips */}
      <div role="tablist" className="flex gap-5 mb-6 border-b border-border">
        {[
          { key: "todas", label: "Todos" },
          { key: "usei", label: "Usados" },
          { key: "sem_decisao", label: "Pendentes" },
        ].map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className="tab"
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="loader-line" />
        </div>
      ) : looks.length === 0 ? (
        <div className="pt-6 text-center max-w-xs mx-auto">
          <HangerIcon size={28} strokeWidth={1.25} className="mx-auto text-gold mb-5" />
          <h2 className="display text-[1.75rem] mb-2">Nenhum look ainda</h2>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Seus looks aparecem aqui depois que você decidir se usou ou não.
          </p>
          <Link href="/looks" className="btn btn-primary w-full">Criar meu primeiro look</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, dateLooks]) => {
            const dateLabel = new Date(date + "T12:00:00").toLocaleDateString(
              "pt-BR",
              { weekday: "long", day: "numeric", month: "long" }
            );
            return (
              <div key={date}>
                <p className="display italic text-lg mb-1 first-letter:uppercase">
                  {dateLabel}
                </p>
                <div className="border-t border-border">
                  {dateLooks.map((look) => (
                    <LookHistoryCard
                      key={look.id}
                      look={look}
                      pecasMap={pecasMap}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
