import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileClock,
  FileCog,
  FileText,
  FilterX,
  LayoutGrid,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../lib/dashboard/auth';
import { useDashboardData } from '../../lib/dashboard/dataApi';
import { dnum, dvNum, isFuture, isStale, PAGE_SIZE, staleDays, STUDENTS, type Student } from '../../lib/dashboard/data';
import { STATUS } from '../../lib/dashboard/status';
import { CSelect, type CSelectItem } from '../../components/dashboard/ui/CSelect';
import { DateInput } from '../../components/dashboard/ui/DatePicker';
import { EmptyState } from '../../components/dashboard/ui/EmptyState';
import { useToast } from '../../components/dashboard/ui/Toast';
import { WAIcon } from '../../components/dashboard/ui/icons';
import { EmptyGhost, STATUS_INK } from './alunos/common';
import { SORT_VAL } from './alunos/filters';
import { ContractModal } from './alunos/ContractModal';
import { contractDownload, contractWhatsApp } from './alunos/contractActions';

/* Tela CONTRATOS — port 1:1 da seção data-view="contratos" do dashboard.html
   (markup l.733–777, JS l.2246–2336: setContractView, filteredContracts,
   clearContractFilters, renderContracts). Lista por padrão (fila de trabalho);
   recusado/falha têm dot vermelho/laranja no filtro = balde "precisa de ação".
   Ações por linha = Abrir/Baixar/WhatsApp, como no preview; as transições de
   status vivem no ⋮ da tela Alunos (qualquer mudança nasce no preview antes —
   PLAN §11). */

interface ContractFilters {
  q: string;
  cStatus: string;
  cActive: string;
  cFrom: string;
  cTo: string;
}

const emptyFilters = (): ContractFilters => ({ q: '', cStatus: '', cActive: '', cFrom: '', cTo: '' });

/* estado da tela sobrevive à ida e volta (modelos/detalhe) — cache de módulo,
   mesmo papel do estado global do preview */
const cache = {
  filters: emptyFilters(),
  page: 1,
  view: 'list' as 'list' | 'grid',
};

/* port filteredContracts (l.2254): busca só por aluno/responsável; mais recentes primeiro */
function filteredContracts(f: ContractFilters): Student[] {
  const q = f.q.toLowerCase();
  const st = f.cStatus, fa = f.cActive;
  const from = dnum(f.cFrom), to = dnum(f.cTo);
  return STUDENTS.filter((s) => {
    const hay = (s.kids.map((k) => k.n).join(' ') + ' ' + s.resp.n).toLowerCase();
    const act =
      fa === '' ? true
        : fa === 'on' ? s.active !== false && !isFuture(s)
        : fa === 'next' ? s.active !== false && isFuture(s)
        : s.active === false;
    const dateOk = (!from || dvNum(s) >= from) && (!to || dvNum(s) <= to);
    return hay.includes(q) && (!st || s.status === st) && act && dateOk;
  }).slice().sort((a, b) => (SORT_VAL.date(b) < SORT_VAL.date(a) ? -1 : 1));
}

/* título do botão verde por status (port waTitle l.2298) */
const waTitle = (s: Student): string =>
  s.status === 'pending' ? 'Enviar contrato no WhatsApp'
    : s.status === 'failed' ? 'Reenviar link no WhatsApp'
    : s.status === 'rejected' ? 'Falar com a família no WhatsApp'
    : 'Cobrar assinatura no WhatsApp';

const contractFile = (s: Student): string => `Contrato_${s.kids[0].n.split(' ')[0]}.pdf`;

/* badge "parado há N dias" (port staleBadge l.2297) */
function StaleBadge({ s, extra = '' }: { s: Student; extra?: string }) {
  if (!isStale(s)) return null;
  return (
    <span
      className={`${extra} inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap`}
      data-tip={`Enviado há ${staleDays(s)} dias e ainda sem assinatura — vale cobrar`}
      style={{ color: '#DC2626', background: 'rgba(220,38,38,.10)' }}
    >
      <FileClock className="w-3 h-3" />
      parado há {staleDays(s)} dias
    </span>
  );
}

export default function Contratos() {
  const { ready } = useDashboardData();
  const { effectiveRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [f, setFState] = useState<ContractFilters>(cache.filters);
  const [page, setPageState] = useState(cache.page);
  const [view, setViewState] = useState<'list' | 'grid'>(cache.view);
  const [cfRowOpen, setCfRowOpen] = useState(false);
  const [modalSid, setModalSid] = useState<number | null>(null);

  if (!ready) {
    return (
      <div className="grid place-content-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
      </div>
    );
  }

  const setF = (patch: Partial<ContractFilters>) => {
    const next = { ...f, ...patch };
    cache.filters = next;
    cache.page = 1;
    setFState(next);
    setPageState(1);
  };
  const setPage = (p: number) => {
    cache.page = p;
    setPageState(p);
    document.getElementById('contractGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setView = (v: 'list' | 'grid') => {
    cache.view = v;
    setViewState(v);
  };
  const clearFilters = () => {
    cache.filters = emptyFilters();
    cache.page = 1;
    setFState(cache.filters);
    setPageState(1);
  };

  /* gate do preview (go() l.1628): a sub-tela Modelos é só do Diretor */
  const openModelos = () => {
    if (effectiveRole !== 'Diretor') {
      toast(`O papel ${effectiveRole} não acessa essa tela.`);
      return;
    }
    navigate('/dashboard/contratos/modelos');
  };

  /* nº de filtros ativos (port renderContracts l.2272–2280) */
  const nFilters =
    (['cStatus', 'cActive'] as const).filter((k) => f[k]).length +
    (f.q.trim() ? 1 : 0) +
    (dnum(f.cFrom) ? 1 : 0) +
    (dnum(f.cTo) ? 1 : 0);

  const all = filteredContracts(f);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const curPage = Math.min(page, pages);
  const rows = all.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const from = all.length ? (curPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(curPage * PAGE_SIZE, all.length);

  const statusItems: CSelectItem[] = [
    { v: '', l: 'Status: todos' },
    { v: 'pending', l: 'Pendentes de envio' },
    { v: 'sent', l: 'Enviados, sem abrir' },
    { v: 'viewed', l: 'Visualizados, sem assinar' },
    { v: 'signed', l: 'Assinados' },
    { v: 'rejected', l: 'Recusados', dot: '#DC2626' },
    { v: 'failed', l: 'Falha no envio', dot: '#EA580C' },
  ];
  const activeItems: CSelectItem[] = [
    { v: '', l: 'Situação: todas' },
    { v: 'on', l: 'Estudando agora' },
    { v: 'next', l: 'Começam em 2026.2' },
    { v: 'off', l: 'Inativas' },
  ];

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-1">Contratos</h1>
          <p className="text-[var(--muted)] text-sm" data-tour="cauto">
            Assinatura digital pelo <span className="text-[var(--text)] font-medium">Autentique</span>: o contrato vai sozinho quando a
            matrícula chega, a família assina pelo link no WhatsApp e o status atualiza aqui — sem subir documento nem perguntar se assinou.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openModelos}
            data-tour="cmodelos"
            data-tip="Gerenciar os modelos de contrato (PDF) usados nas matrículas"
            className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
          >
            <FileCog className="w-4 h-4" />
            <span className="hidden sm:inline">Modelos de contrato</span>
          </button>
          <div className="flex items-center bg-[var(--hover)] rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              data-tip="Ver em cartões"
              className={`px-3 py-1.5 rounded-lg ${view === 'grid' ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--muted)]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              data-tip="Ver em lista"
              className={`px-3 py-1.5 rounded-lg ${view === 'list' ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--muted)]'}`}
            >
              <Rows3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* busca + filtros (mesma estrutura da tela de Alunos) */}
      <div className="surface rounded-2xl p-3 mb-4 space-y-2.5" data-tour="cfiltros">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-3 h-10 flex-1 min-w-0" style={{ background: 'var(--hover)' }}>
            <Search className="w-4 h-4 text-[var(--muted)]" />
            <input
              id="contractSearch"
              value={f.q}
              onChange={(e) => setF({ q: e.target.value })}
              placeholder="Buscar por aluno ou responsável…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          {nFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex h-10 px-3 rounded-xl text-sm font-semibold transition items-center gap-1.5 shrink-0"
              style={{ background: 'rgba(245,183,0,.14)', color: '#B5860B' }}
            >
              <FilterX className="w-4 h-4" />
              Limpar <span>({nFilters})</span>
            </button>
          )}
          <button
            onClick={() => setCfRowOpen((o) => !o)}
            className="md:hidden h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium flex items-center gap-1.5 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: cfRowOpen ? 'rotate(180deg)' : undefined }} />
          </button>
        </div>
        <div
          id="cfRow"
          className={`${cfRowOpen ? '' : 'collapsed'} md:!flex flex flex-wrap items-center gap-2 pt-2.5 border-t`}
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </span>
          <CSelect value={f.cStatus} items={statusItems} onChange={(v) => setF({ cStatus: v })} ariaLabel="Filtrar por status do contrato" />
          <CSelect value={f.cActive} items={activeItems} onChange={(v) => setF({ cActive: v })} ariaLabel="Filtrar por situação" />
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">Matrícula:</span>
            <span className="relative">
              <DateInput
                value={f.cFrom}
                onChange={(v) => setF({ cFrom: v })}
                startYear={2026}
                placeholder="de dd/mm/aaaa"
                className="w-[136px] h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 text-sm outline-none focus:ring-2 ring-brand-light"
              />
            </span>
            <span className="relative">
              <DateInput
                value={f.cTo}
                onChange={(v) => setF({ cTo: v })}
                startYear={2026}
                placeholder="até dd/mm/aaaa"
                className="w-[136px] h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 text-sm outline-none focus:ring-2 ring-brand-light"
              />
            </span>
          </span>
        </div>
      </div>

      {/* grid/lista (port renderContracts l.2288–2334) */}
      {rows.length === 0 ? (
        <div id="contractGrid" className="surface rounded-2xl">
          {!STUDENTS.length ? (
            <EmptyState
              icon={FileText}
              title="Nenhum contrato ainda"
              sub="Os contratos aparecem aqui assim que as primeiras matrículas forem feitas."
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nada encontrado"
              sub="Nenhum contrato bate com esses filtros."
              action={<EmptyGhost label="Limpar filtros" icon={<RotateCcw className="w-4 h-4" />} onClick={clearFilters} />}
            />
          )}
        </div>
      ) : view === 'grid' ? (
        <div id="contractGrid" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((s) => {
            const st = STATUS_INK[s.status];
            return (
              <div key={s.id} className="surface rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl grid place-content-center" style={{ background: 'var(--hover)' }}>
                    <FileText className="w-5 h-5 text-brand-light" />
                  </div>
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: st.c, background: st.bg }}>
                      {STATUS[s.status].label}
                    </span>
                    <StaleBadge s={s} />
                  </span>
                </div>
                <p className="font-medium mt-3 truncate">{contractFile(s)}</p>
                <p className="text-xs text-[var(--muted)]">
                  {s.resp.n} · {s.date}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setModalSid(s.id)}
                    className="flex-1 h-9 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => contractDownload(s, toast)}
                    data-tip="Baixar"
                    className="w-9 h-9 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => contractWhatsApp(s, toast)}
                    data-tip={waTitle(s)}
                    className="w-9 h-9 rounded-lg grid place-content-center text-white transition hover:brightness-105"
                    style={{ background: '#25D366' }}
                  >
                    <WAIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div id="contractGrid" className="surface rounded-2xl overflow-hidden">
          {rows.map((s) => {
            const st = STATUS_INK[s.status];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b last:border-0 hover:bg-[var(--hover)] transition"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'var(--hover)' }}>
                  <FileText className="w-[18px] h-[18px] text-brand-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {s.kids.map((k) => k.n.split(' ')[0]).join(' e ')}{' '}
                    <span className="text-[var(--muted)] font-normal">· {contractFile(s)}</span>
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {s.resp.n} · {s.date}
                    {s.hora ? ' às ' + s.hora : ''}
                  </p>
                </div>
                <StaleBadge s={s} extra="hidden sm:!inline-flex" />
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{ color: st.c, background: st.bg }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.c }} />
                  {STATUS[s.status].label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setModalSid(s.id)}
                    data-tip="Abrir"
                    aria-label="Abrir"
                    className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => contractDownload(s, toast)}
                    data-tip="Baixar"
                    aria-label="Baixar"
                    className="w-8 h-8 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => contractWhatsApp(s, toast)}
                    data-tip={waTitle(s)}
                    aria-label={waTitle(s)}
                    className="w-8 h-8 rounded-lg grid place-content-center text-white transition hover:brightness-105"
                    style={{ background: '#25D366' }}
                  >
                    <WAIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="surface rounded-2xl flex flex-wrap items-center justify-between gap-2 px-5 py-3 mt-3 text-sm text-[var(--muted)]">
        <span>{`Mostrando ${from}–${to} de ${all.length} contratos`}</span>
        <div className="flex items-center gap-1">
          <Pager page={curPage} pages={pages} onPage={setPage} />
        </div>
      </div>

      {modalSid !== null && (
        <ContractModal sid={modalSid} onClose={() => setModalSid(null)} onOpenDetail={() => navigate(`/dashboard/alunos/${modalSid}`)} />
      )}
    </section>
  );
}

/* paginação numerada com janela de até 5 páginas (port pagerHTML l.2121 —
   o mesmo pager da tela Alunos) */
function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = (label: ReactNode, p: number, on: boolean, dis: boolean, key: string | number) => (
    <button
      key={key}
      disabled={dis}
      onClick={() => onPage(p)}
      className={`min-w-8 h-8 px-1.5 rounded-lg grid place-content-center text-sm font-medium transition ${on ? 'text-white' : 'border border-[var(--border)] hover:bg-[var(--hover)]'} disabled:opacity-35`}
      style={on ? { background: '#1E3765' } : undefined}
    >
      {label}
    </button>
  );
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums = [];
  for (let p = start; p <= end; p++) nums.push(btn(p, p, p === page, false, p));
  return (
    <>
      {btn(<ChevronLeft className="w-4 h-4" />, page - 1, false, page === 1, 'prev')}
      {start > 1 && btn(1, 1, false, false, 'first')}
      {start > 2 && <span className="px-0.5">…</span>}
      {nums}
      {end < pages - 1 && <span className="px-0.5">…</span>}
      {end < pages && btn(pages, pages, false, false, 'last')}
      {btn(<ChevronRight className="w-4 h-4" />, page + 1, false, page === pages, 'next')}
    </>
  );
}
