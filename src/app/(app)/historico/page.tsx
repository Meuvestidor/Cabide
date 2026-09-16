"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  Loader2,
  ShieldCheck,
  Zap,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Calendar,
  Shirt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OCASIOES, FORMALIDADE_LABELS } from "@/lib/constants";
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

const LOOK_CONFIG: Record<
  LookTipo,
  { label: string; color: string; icon: typeof ShieldCheck }
> = {
  safe: { label: "Safe", color: "text-success", icon: ShieldCheck },
  cool: { label: "Cool", color: "text-primary", icon: Zap },
  risky: { label: "Risky", color: "text-warning", icon: Flame },
};

function DecisaoTag({ decisao }: { decisao: string | null }) {
  if (!decisao) return null;
  const map: Record<string, { label: string; icon: typeof ThumbsUp; cls: string }> = {
    usei: { label: "Usei", icon: ThumbsUp, cls: "bg-success/10 text-success" },
    nao_usei: { label: "Não usei", icon: Minus, cls: "bg-surface-alt text-muted" },
    nao_gostei: { label: "Não gostei", icon: ThumbsDown, cls: "bg-danger/10 text-danger" },
  };
  const cfg = map[decisao];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function LookHistoryCard({
  look,
  pecasMap,
}: {
  look: LookRow;
  pecasMap: Map<string, PecaMin>;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = LOOK_CONFIG[look.tipo];
  const Icon = config.icon;
  const lookPecas = look.pecas
    .map((id) => pecasMap.get(id))
    .filter(Boolean) as PecaMin[];

  const date = new Date(look.data || look.created_at).toLocaleDateString(
    "pt-BR",
    { day: "numeric", month: "short" }
  );

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {config.label}
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
        <div className="px-4 pb-4 border-t border-border pt-3">
          {/* Piece thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {lookPecas.map((p) => (
              <div
                key={p.id}
                className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-alt"
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
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-alt text-muted"
              >
                {p.nome}
              </span>
            ))}
          </div>

          {/* Explanation */}
          <p className="text-sm text-muted mt-3 leading-relaxed">
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
    <div className="pt-6 pb-4">
      <h1 className="text-2xl text-foreground mb-1">Histórico de Looks</h1>
      <p className="text-muted text-sm mb-4">
        {looks.length} {looks.length === 1 ? "look criado" : "looks criados"}
      </p>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "todas", label: "Todos" },
          { key: "usei", label: "Usados" },
          { key: "sem_decisao", label: "Pendentes" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-surface border border-border text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : looks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium">Nenhum look criado</p>
          <p className="text-muted text-xs">
            Gere seus primeiros looks na aba Criar.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dateLooks]) => {
            const dateLabel = new Date(date + "T12:00:00").toLocaleDateString(
              "pt-BR",
              { weekday: "long", day: "numeric", month: "long" }
            );
            return (
              <div key={date}>
                <p className="text-xs text-muted font-medium mb-2 capitalize">
                  {dateLabel}
                </p>
                <div className="space-y-3">
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
