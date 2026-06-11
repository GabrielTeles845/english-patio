import { useEffect, useState, type ReactNode } from 'react';
import { History, PenLine, Search, SearchX, ShieldCheck, UserRound, Zap } from 'lucide-react';
import { initials } from '../../lib/dashboard/auth';
import { fetchActivity } from '../../lib/dashboard/activityApi';
import { ApiError } from '../../lib/dashboard/api';
import { ACT_ACTORS, type ActEntry } from '../../lib/dashboard/data';
import { CSelect, type CSelectItem } from '../../components/dashboard/ui/CSelect';
import { EmptyState } from '../../components/dashboard/ui/EmptyState';
import { useToast } from '../../components/dashboard/ui/Toast';

/* Tela REGISTRO DE ATIVIDADES — port 1:1 da seção data-view="atividade" do
   dashboard.html (markup l.951–965, JS renderActivity l.2436–2470). Somente
   leitura: pessoas, o Sistema (rotinas automáticas) e o Autentique (webhook
   de assinatura) — não se edita nem se apaga. O texto da ação vem com <b>
   do mock (conteúdo controlado → dangerouslySetInnerHTML, como nas demais
   telas portadas). */

/* ícone dos atores automáticos (ACT_ACTORS.ic: Sistema=zap, Autentique=pen-line) */
const ACTOR_ICON: Record<string, typeof Zap> = { zap: Zap, 'pen-line': PenLine };

export default function Atividade() {
  const { toastErr } = useToast();
  const [q, setQ] = useState('');
  const [fw, setFw] = useState('');
  const [all, setAll] = useState<ActEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchActivity();
        if (alive) setAll(data);
      } catch (err) {
        if (alive) toastErr(err instanceof ApiError ? err.message : 'Não foi possível carregar o registro.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toastErr]);

  /* opções de ator a partir do que veio (mais "Todos") */
  const whoItems: CSelectItem[] = [
    { v: '', l: 'Todos' },
    ...Array.from(new Set(all.map((x) => x.who))).map((w) => ({ v: w, l: w })),
  ];

  /* port do filtro (l.2438–2443): busca no texto sem as tags + filtro por ator */
  const needle = q.toLowerCase();
  const rows = all.filter((x) => {
    const hay = (x.who + ' ' + x.a.replace(/<[^>]+>/g, '')).toLowerCase();
    return hay.includes(needle) && (!fw || x.who === fw);
  });

  /* agrupado por dia (Hoje / Ontem / data) na ordem em que aparecem */
  let lastDay: string | null = null;
  const list: ReactNode[] = [];
  rows.forEach((x, i) => {
    if (x.day !== lastDay) {
      lastDay = x.day;
      list.push(
        <p key={`day-${i}`} className="px-5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {x.day}
        </p>,
      );
    }
    list.push(<Row key={i} x={x} />);
  });

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Registro de atividades</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            Quem fez o quê no painel — cada ação fica guardada, inclusive as automáticas do sistema e do Autentique
          </p>
        </div>
      </div>

      <div className="surface rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2" data-tour="act-filtros">
        <div className="flex items-center gap-2 rounded-xl px-3 h-10 flex-1 min-w-[200px]" style={{ background: 'var(--hover)' }}>
          <Search className="w-4 h-4 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por pessoa, aluno ou ação…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <CSelect
          value={fw}
          items={whoItems}
          onChange={setFw}
          icon={<UserRound className="w-4 h-4 text-[var(--muted)]" />}
          ariaLabel="Filtrar por ator"
        />
      </div>

      <div className="surface rounded-2xl overflow-hidden" data-tour="act-list">
        {loading ? (
          <div className="p-10 grid place-content-center">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          all.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhuma atividade ainda"
              sub="Cada ação na dashboard (matrícula, mudança de turma, contrato) vai ser registrada aqui."
            />
          ) : (
            <EmptyState icon={SearchX} title="Nada encontrado" sub="Nenhuma atividade bate com esses filtros." />
          )
        ) : (
          list
        )}
      </div>

      <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> O registro não pode ser editado nem apagado — é a memória de segurança
        do painel.
      </p>
    </section>
  );
}

/* linha da lista (port l.2452–2466): avatar/ícone por ator, ação com <b>, hora */
function Row({ x }: { x: ActEntry }) {
  const actor = ACT_ACTORS[x.who] ?? { role: '', c: '#64748B' };
  const Icon = actor.ic ? ACTOR_ICON[actor.ic] ?? Zap : null;
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      {Icon ? (
        <div
          className="w-9 h-9 rounded-full grid place-content-center shrink-0"
          style={{ background: `${actor.c}1f`, color: actor.c }}
        >
          <Icon className="w-4 h-4" />
        </div>
      ) : (
        <div
          className="w-9 h-9 rounded-full grid place-content-center text-white text-xs font-semibold shrink-0"
          style={{ background: actor.c }}
        >
          {initials(x.who)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {/* conteúdo do mock (negritos <b>) — controlado, mesmo padrão das outras telas */}
        <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: x.a }} />
        <p className="text-[11px] text-[var(--muted)] mt-0.5">
          {x.who}
          {actor.role ? ' · ' + actor.role : ''}
        </p>
      </div>
      <span className="text-[11px] text-[var(--muted)] whitespace-nowrap shrink-0 mt-0.5">{x.t}</span>
    </div>
  );
}
