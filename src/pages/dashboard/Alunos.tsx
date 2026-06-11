import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  FilterX,
  FileUp,
  GraduationCap,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Send,
  Sheet,
  SlidersHorizontal,
  UserRound,
  UserRoundX,
  Users,
  Trash2,
} from 'lucide-react';
import { initials, useAuth } from '../../lib/dashboard/auth';
import { logAct, setContractStatus } from '../../lib/dashboard/store';
import { useDashboardData } from '../../lib/dashboard/dataApi';
import {
  HORAS,
  FAMS,
  NIVEIS,
  SALAS,
  STUDENTS,
  isFuture,
  type Student,
} from '../../lib/dashboard/data';
import { CSelect, type CSelectItem } from '../../components/dashboard/ui/CSelect';
import { DateInput } from '../../components/dashboard/ui/DatePicker';
import { EmptyState, EmptyButton } from '../../components/dashboard/ui/EmptyState';
import { RowMenu, type RowMenuEntry } from '../../components/dashboard/ui/RowMenu';
import { StatusBadge } from '../../components/dashboard/ui/StatusBadge';
import { useToast } from '../../components/dashboard/ui/Toast';
import { WAIcon } from '../../components/dashboard/ui/icons';
import {
  activeFilterCount,
  emptyFilters,
  famGroupRows,
  filteredStudents,
  SORT_VAL,
  TABLE_COLS,
  type AlunoFilters,
  type SortKey,
} from './alunos/filters';
import { avatarGrad, copyPhone, EmptyGhost, FamBadge, KidTurmaChip, MediaIcon, TurmaCell } from './alunos/common';
import { exportStudentsCSV } from './alunos/exportCsv';
import { NewEnrollmentModal } from './alunos/NewEnrollmentModal';
import { EditEnrollmentModal } from './alunos/EditEnrollmentModal';
import { ImportModal } from './alunos/ImportModal';
import { ContractModal } from './alunos/ContractModal';
import { ExitModal, reactivateWithFeedback } from './alunos/ExitModal';
import { DeleteModal } from './alunos/DeleteModal';

/* Tela ALUNOS — port 1:1 da seção data-view="alunos" do dashboard.html
   (markup l.629–684, JS l.1943–2166). Tabela com cabeçalho ordenável no
   desktop e cards no mobile (mesmos ids/classes do preview: #tableBody,
   .table-shell, .table-foot, #fRow.collapsed — o CSS já existe). */

const PAGE_SIZE = 20;

/* estado da tela sobrevive à ida e volta do detalhe (no preview a view nunca
   desmonta — aqui o cache de módulo cumpre o mesmo papel) */
const cache = {
  filters: emptyFilters(),
  sortKey: 'name' as SortKey,
  sortDir: 1,
  page: 1,
  famGroup: false,
};

/* deep-link da Visão geral (goPendentes do preview, l.3550: csSet('fStatus',…)) —
   pré-arma os filtros antes de navegar pra cá */
export function presetAlunos(p: Partial<AlunoFilters>) {
  cache.filters = { ...emptyFilters(), ...p };
  cache.page = 1;
}

type ModalState =
  | null
  | { kind: 'new' }
  | { kind: 'edit'; sid: number }
  | { kind: 'import' }
  | { kind: 'contract'; sid: number }
  | { kind: 'exit'; sid: number }
  | { kind: 'delete'; sid: number };

export default function Alunos() {
  const { ready } = useDashboardData();
  const { effectiveRole, effectiveUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canWrite = effectiveRole !== 'Supervisor'; // Supervisor: alunos só leitura (PLAN §4)
  const who = effectiveUser?.name ?? 'Equipe';

  const [f, setFState] = useState<AlunoFilters>(cache.filters);
  const [sortKey, setSortKeyState] = useState<SortKey>(cache.sortKey);
  const [sortDir, setSortDirState] = useState(cache.sortDir);
  const [page, setPageState] = useState(cache.page);
  const [famGroup, setFamGroupState] = useState(cache.famGroup);
  const [fRowOpen, setFRowOpen] = useState(false);
  const [menu, setMenu] = useState<{ anchor: DOMRect; sid: number } | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const setF = (patch: Partial<AlunoFilters>) => {
    const next = { ...f, ...patch };
    cache.filters = next;
    cache.page = 1;
    setFState(next);
    setPageState(1);
  };
  const setPage = (p: number) => {
    cache.page = p;
    setPageState(p);
    document.querySelector('.table-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setSort = (k: SortKey) => {
    if (sortKey === k) {
      cache.sortDir = -sortDir;
      setSortDirState(-sortDir);
    } else {
      cache.sortKey = k;
      cache.sortDir = 1;
      setSortKeyState(k);
      setSortDirState(1);
    }
    cache.page = 1;
    setPageState(1);
  };
  const toggleFamGroup = () => {
    const v = !famGroup;
    cache.famGroup = v;
    cache.page = 1;
    setFamGroupState(v);
    setPageState(1);
    toast(v ? 'Matrículas da mesma família agora aparecem juntas.' : 'Agrupamento por família desligado.');
  };
  const clearFilters = () => {
    cache.filters = emptyFilters();
    cache.page = 1;
    setFState(cache.filters);
    setPageState(1);
    toast('Filtros limpos.');
  };

  /* itens dos selects de filtro (port init() l.3908–3927) */
  const nivelItems = useMemo<CSelectItem[]>(() => {
    const out: CSelectItem[] = [{ v: '', l: 'Nível: todos' }];
    (Object.entries(FAMS) as [keyof typeof FAMS, (typeof FAMS)[keyof typeof FAMS]][]).forEach(([fk, fam]) => {
      out.push({ v: 'fam:' + fk, l: 'Todos os ' + fam.n, dot: fam.c, bold: true });
      NIVEIS.filter((n) => n.fam === fk).forEach((n) => out.push({ v: n.k, l: n.n, pad: true }));
    });
    return out;
  }, []);
  const salaItems = useMemo<CSelectItem[]>(
    () => [{ v: '', l: 'Sala: todas' }, ...SALAS.map((s) => ({ v: s.id, l: s.n, dot: s.c })), { v: 'none', l: 'Sem turma', dot: '#B5860B' }],
    [],
  );
  const profItems = useMemo<CSelectItem[]>(() => {
    const profs = [...new Set(SALAS.map((s) => s.prof).filter(Boolean) as string[])].sort();
    return [{ v: '', l: 'Teacher: todos' }, ...profs.map((p) => ({ v: p, l: p })), { v: 'none', l: 'Sem teacher', dot: '#B5860B' }];
  }, []);
  const horaItems = useMemo<CSelectItem[]>(() => [{ v: '', l: 'Horário: todos' }, ...HORAS.map((h) => ({ v: h, l: h }))], []);
  const hoodItems = useMemo<CSelectItem[]>(() => {
    const hoods = [...new Set(STUDENTS.map((s) => s.addr.bairro))].sort();
    return [{ v: '', l: 'Bairro: todos' }, ...hoods.map((h) => ({ v: h, l: h }))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STUDENTS.length]);

  if (!ready) {
    return (
      <div className="grid place-content-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
      </div>
    );
  }

  /* linhas: filtra → ordena → (famílias juntas) → pagina (port renderTable l.2149) */
  let rows = filteredStudents(f).slice().sort((a, b) => {
    const va = SORT_VAL[sortKey](a), vb = SORT_VAL[sortKey](b);
    return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
  });
  if (famGroup) rows = famGroupRows(rows);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const curPage = Math.min(page, pages);
  const pageRows = rows.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const from = rows.length ? (curPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(curPage * PAGE_SIZE, rows.length);
  const nFilters = activeFilterCount(f);

  const allAct = STUDENTS.filter((s) => s.active !== false);
  const allKids = allAct.reduce((a, s) => a + s.kids.length, 0);

  /* menu ⋮ — transições válidas por status atual (port openRowMenu l.5447) */
  const openRowMenu = (e: MouseEvent, sid: number) => {
    e.stopPropagation();
    setMenu({ anchor: (e.currentTarget as HTMLElement).getBoundingClientRect(), sid });
  };
  const menuItems = (s: Student): RowMenuEntry[] => {
    const item = (icon: ReactNode, label: string, onClick: () => void, color?: string): RowMenuEntry => ({ icon, label, onClick, color });
    const wa = (label: string, msg = 'Contrato pronto para envio no WhatsApp!'): RowMenuEntry => ({
      icon: (
        <span style={{ color: '#1faa53' }}>
          <WAIcon className="w-4 h-4" />
        </span>
      ),
      label,
      onClick: () => toast(msg),
    });
    /* Supervisor vê os alunos só para consulta — menu reduzido (sem editar/contrato/desligar) */
    if (!canWrite)
      return [
        item(<UserRound className="w-4 h-4 text-[var(--muted)]" />, 'Ver ficha completa', () => navigate(`/dashboard/alunos/${s.id}`)),
        item(<Copy className="w-4 h-4 text-[var(--muted)]" />, 'Copiar telefone do responsável', () => copyPhone(s, toast)),
      ];
    /* ações dependem do status atual do contrato (sem transições redundantes).
       Visualizado/assinado chegam sozinhos pelo Autentique — o "marcar" manual é só backup. */
    const markSent = async () => {
      const res = await setContractStatus(s.id, 'sent');
      if (!res.ok) return toast(res.error);
      logAct(who, `Marcou o contrato de <b>${s.kids[0].n}</b> como enviado`);
      toast('Contrato marcado como enviado!');
    };
    const markSigned = async () => {
      const res = await setContractStatus(s.id, 'signed');
      if (!res.ok) return toast(res.error);
      logAct(who, `Marcou o contrato de <b>${s.kids[0].n}</b> como assinado`);
      toast('Contrato marcado como assinado!');
    };
    const statusActions: RowMenuEntry[] =
      s.status === 'pending'
        ? [
            wa('Enviar contrato no WhatsApp'),
            'divider',
            item(<Send className="w-4 h-4 text-[var(--muted)]" />, 'Marcar como enviado', markSent),
            item(<CheckCircle2 className="w-4 h-4 text-[var(--muted)]" />, 'Marcar como assinado', markSigned),
          ]
        : s.status === 'sent' || s.status === 'viewed'
          ? [
              wa('Cobrar assinatura no WhatsApp', 'Cobrança preparada no WhatsApp — link de assinatura incluído!'),
              'divider',
              item(<CheckCircle2 className="w-4 h-4 text-[var(--muted)]" />, 'Marcar como assinado', markSigned),
            ]
          : s.status === 'failed'
            ? [
                /* falha na entrega: a ação válida é reenviar (volta pro caminho feliz como "enviado") */
                wa('Reenviar link no WhatsApp', 'Reenvio preparado no WhatsApp — link de assinatura incluído!'),
                'divider',
                item(<RotateCcw className="w-4 h-4 text-[var(--muted)]" />, 'Reenviar contrato (marcar como enviado)', markSent),
              ]
            : s.status === 'rejected'
              ? [/* recusado: só faz sentido refazer/reenviar o contrato */ item(<RotateCcw className="w-4 h-4 text-[var(--muted)]" />, 'Reenviar contrato (marcar como enviado)', markSent)]
              : [];
    /* desligar / reativar / excluir — Diretor e Secretaria fazem isso direto pela dashboard */
    const exitActions: RowMenuEntry[] = [
      'divider',
      s.active === false
        ? item(<RotateCcw className="w-4 h-4" />, 'Reativar aluno', () => reactivateWithFeedback(s.id, who, toast), '#16a34a')
        : item(<UserRoundX className="w-4 h-4" />, 'Desligar aluno', () => setModal({ kind: 'exit', sid: s.id }), '#DC2626'),
      item(<Trash2 className="w-4 h-4" />, 'Excluir matrícula', () => setModal({ kind: 'delete', sid: s.id }), 'rgba(220,38,38,.75)'),
    ];
    return [
      item(<UserRound className="w-4 h-4 text-[var(--muted)]" />, 'Ver ficha completa', () => navigate(`/dashboard/alunos/${s.id}`)),
      item(<Pencil className="w-4 h-4 text-[var(--muted)]" />, 'Editar dados', () => setModal({ kind: 'edit', sid: s.id })),
      item(<FileText className="w-4 h-4 text-[var(--muted)]" />, 'Ver contrato', () => setModal({ kind: 'contract', sid: s.id })),
      item(<Download className="w-4 h-4 text-[var(--muted)]" />, 'Baixar contrato', () => toast('Download iniciado (demo)')),
      item(<Copy className="w-4 h-4 text-[var(--muted)]" />, 'Copiar telefone do responsável', () => copyPhone(s, toast)),
      ...statusActions,
      ...exitActions,
    ];
  };

  const doExport = () => {
    const data = filteredStudents(f);
    exportStudentsCSV(data);
    logAct(who, `Exportou a planilha de alunos (${data.length} matrículas)`);
    toast(`Planilha exportada com ${data.length} matrícula${data.length > 1 ? 's' : ''}!`);
  };

  const fSel = (key: keyof AlunoFilters, items: CSelectItem[], aria: string) => (
    <CSelect value={f[key]} items={items} onChange={(v) => setF({ [key]: v })} ariaLabel={aria} />
  );

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Alunos</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">{`${allKids} alunos em ${allAct.length} matrículas ativas`}</p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <button
              onClick={() => setModal({ kind: 'import' })}
              data-tip="Traz os alunos da planilha atual de matrículas, removendo repetidos e separando nomes iguais e dados estranhos para você conferir"
              className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
            >
              <FileUp className="w-4 h-4" />
              <span className="hidden sm:inline">Importar planilha</span>
            </button>
          )}
          <button
            onClick={doExport}
            data-tip="Baixa um arquivo que abre no Excel ou Google Planilhas"
            className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
          >
            <Sheet className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar planilha</span>
          </button>
          {canWrite && (
            <button
              onClick={() => setModal({ kind: 'new' })}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
            >
              <Plus className="w-4 h-4" />
              Nova matrícula
            </button>
          )}
        </div>
      </div>

      {/* filtros */}
      <div className="surface rounded-2xl p-3 mb-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-3 h-10 flex-1 min-w-0" style={{ background: 'var(--hover)' }}>
            <Search className="w-4 h-4 text-[var(--muted)]" />
            <input
              id="alunoSearch"
              value={f.q}
              onChange={(e) => setF({ q: e.target.value })}
              placeholder="Buscar por nome, responsável ou bairro…"
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
            onClick={toggleFamGroup}
            data-tip="Matrículas da mesma família (mesmo responsável) aparecem uma embaixo da outra, mesmo na ordem alfabética"
            className="h-10 px-3 rounded-xl border text-sm font-medium flex items-center gap-1.5 shrink-0 transition"
            style={
              famGroup
                ? { background: 'rgba(47,83,154,.10)', color: '#2F539A', borderColor: 'rgba(47,83,154,.45)' }
                : { borderColor: 'var(--border)' }
            }
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Famílias juntas</span>
          </button>
          <button
            onClick={() => setFRowOpen((o) => !o)}
            className="md:hidden h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium flex items-center gap-1.5 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: fRowOpen ? 'rotate(180deg)' : undefined }} />
          </button>
        </div>
        <div
          id="fRow"
          className={`${fRowOpen ? '' : 'collapsed'} md:!flex flex flex-wrap items-center gap-2 pt-2.5 border-t`}
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </span>
          {fSel('fNivel', nivelItems, 'Filtrar por nível')}
          {fSel('fSala', salaItems, 'Filtrar por sala')}
          {fSel('fProf', profItems, 'Filtrar por teacher')}
          {fSel('fHora', horaItems, 'Filtrar por horário')}
          {fSel('fDia', [{ v: '', l: 'Dias: todos' }, { v: 'seg-qua', l: 'Seg/Qua' }, { v: 'ter-qui', l: 'Ter/Qui' }], 'Filtrar por dias')}
          {fSel('fPeriodo', [{ v: '', l: 'Período: todos' }, { v: 'm', l: 'Matutino' }, { v: 't', l: 'Vespertino' }], 'Filtrar por período')}
          {fSel(
            'fStatus',
            [
              { v: '', l: 'Contrato: todos' },
              { v: 'signed', l: 'Assinado' },
              { v: 'viewed', l: 'Visualizado' },
              { v: 'sent', l: 'Enviado' },
              { v: 'pending', l: 'Pendente' },
              { v: 'rejected', l: 'Recusado', dot: '#DC2626' },
              { v: 'failed', l: 'Falha no envio', dot: '#EA580C' },
            ],
            'Filtrar por status do contrato',
          )}
          {fSel(
            'fActive',
            [
              { v: '', l: 'Situação: todas' },
              { v: 'on', l: 'Estudando agora' },
              { v: 'next', l: 'Começam em 2026.2' },
              { v: 'off', l: 'Inativas' },
            ],
            'Filtrar por situação',
          )}
          {fSel('fHood', hoodItems, 'Filtrar por bairro')}
          {fSel(
            'fAge',
            [
              { v: '', l: 'Idade: todas' },
              { v: '4-6', l: '4 a 6 anos' },
              { v: '7-9', l: '7 a 9 anos' },
              { v: '10-12', l: '10 a 12 anos' },
              { v: '13+', l: '13 anos ou mais' },
            ],
            'Filtrar por idade',
          )}
          {fSel(
            'fMedia',
            [
              { v: '', l: 'Imagem: todos' },
              { v: 'yes', l: 'Autorizou imagem' },
              { v: 'no', l: 'Não autorizou' },
            ],
            'Filtrar por autorização de imagem',
          )}
          {fSel(
            'fSib',
            [
              { v: '', l: 'Irmãos: todos' },
              { v: 'multi', l: 'Com irmãos' },
              { v: 'single', l: 'Aluno único' },
            ],
            'Filtrar por irmãos',
          )}
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">Matrícula:</span>
            <span className="relative">
              <DateInput
                value={f.fFrom}
                onChange={(v) => setF({ fFrom: v })}
                startYear={2026}
                placeholder="de dd/mm/aaaa"
                className="w-[136px] h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 text-sm outline-none focus:ring-2 ring-brand-light"
              />
            </span>
            <span className="relative">
              <DateInput
                value={f.fTo}
                onChange={(v) => setF({ fTo: v })}
                startYear={2026}
                placeholder="até dd/mm/aaaa"
                className="w-[136px] h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-3 pr-8 text-sm outline-none focus:ring-2 ring-brand-light"
              />
            </span>
          </span>
        </div>
      </div>

      {/* tabela com design próprio (cabeçalho ordenável; cards no mobile) */}
      <div className="surface rounded-2xl overflow-hidden table-shell">
        <div
          className="hidden md:grid grid-cols-[1.45fr_1.1fr_1fr_.8fr_.7fr_.85fr_.8fr_52px] gap-3 px-5 py-3 text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          {TABLE_COLS.map((c) => {
            const on = c.k === sortKey;
            return (
              <button
                key={c.k}
                onClick={() => setSort(c.k)}
                data-tip={c.k === 'since' ? 'Desde quando o aluno está na escola (ordena por essa data)' : 'Ordenar por ' + c.l}
                className={`flex items-center gap-1 text-left uppercase tracking-wider font-semibold transition hover:text-[var(--text)] ${on ? 'text-[var(--text)]' : ''}`}
              >
                {c.l}
                <span className="text-[9px] leading-none">{on ? (sortDir === 1 ? '▲' : '▼') : '↕'}</span>
              </button>
            );
          })}
          <span className="text-right">Ações</span>
        </div>
        <div id="tableBody">
          {pageRows.length === 0 ? (
            !STUDENTS.length ? (
              <EmptyState
                icon={GraduationCap}
                title="Ainda não há alunos"
                sub="Quando uma matrícula chegar pelo site, o aluno aparece aqui automaticamente."
                action={canWrite ? <EmptyButton icon={Plus} label="Nova matrícula" onClick={() => setModal({ kind: 'new' })} /> : undefined}
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nada encontrado"
                sub="Nenhum aluno bate com esses filtros. Tente afrouxar a busca."
                action={<EmptyGhost label="Limpar filtros" icon={<RotateCcw className="w-4 h-4" />} onClick={clearFilters} />}
              />
            )
          ) : (
            pageRows.map((s) => <Row key={s.id} s={s} famGroup={famGroup} onMenu={openRowMenu} onOpen={() => navigate(`/dashboard/alunos/${s.id}`)} />)
          )}
        </div>
        <div
          className="table-foot flex flex-wrap items-center justify-between gap-2 px-5 py-3 md:border-t text-sm text-[var(--muted)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <span>{`Mostrando ${from}–${to} de ${rows.length} matrículas · dados fictícios`}</span>
          <div className="flex items-center gap-1">
            <Pager page={curPage} pages={pages} onPage={setPage} />
          </div>
        </div>
      </div>

      {menu && (() => {
        const s = STUDENTS.find((x) => x.id === menu.sid);
        if (!s) return null;
        return <RowMenu anchor={menu.anchor} items={menuItems(s)} onClose={() => setMenu(null)} />;
      })()}
      {modal?.kind === 'new' && <NewEnrollmentModal onClose={() => setModal(null)} />}
      {modal?.kind === 'edit' && <EditEnrollmentModal sid={modal.sid} onClose={() => setModal(null)} />}
      {modal?.kind === 'import' && <ImportModal onClose={() => setModal(null)} />}
      {modal?.kind === 'contract' && (
        <ContractModal sid={modal.sid} onClose={() => setModal(null)} onOpenDetail={() => navigate(`/dashboard/alunos/${modal.sid}`)} />
      )}
      {modal?.kind === 'exit' && <ExitModal sid={modal.sid} onClose={() => setModal(null)} />}
      {modal?.kind === 'delete' && <DeleteModal sid={modal.sid} onClose={() => setModal(null)} />}
    </section>
  );
}

/* linha da tabela / card mobile (port rowHTML l.1971) — mesmo nó com os dois
   formatos, como no preview; o CSS mobile (#tableBody > div) faz o resto */
function Row({
  s,
  famGroup,
  onMenu,
  onOpen,
}: {
  s: Student;
  famGroup: boolean;
  onMenu: (e: MouseEvent, sid: number) => void;
  onOpen: () => void;
}) {
  const inactive = s.active === false;
  const multi = s.kids.length > 1;
  const fam = STUDENTS.filter((x) => x.resp.cpf === s.resp.cpf).length;
  const fut = !inactive && isFuture(s);
  const pillStyle = inactive
    ? { color: '#64748B', background: 'rgba(100,116,139,.14)' }
    : fut
      ? { color: '#2F539A', background: 'rgba(47,83,154,.12)' }
      : { color: '#16a34a', background: 'rgba(22,163,74,.10)' };
  const pillDot = inactive ? '#94a3b8' : fut ? '#2F539A' : '#16a34a';
  const actPill = (
    <span
      data-tip={
        inactive && s.exit
          ? `Desligado em ${s.exit.date} — ${s.exit.label}`
          : fut
            ? 'Matrícula do período aberto — as aulas começam em Julho (2026.2)'
            : undefined
      }
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
      style={pillStyle}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pillDot }} />
      {inactive ? 'Inativa' : fut ? 'Começa em Jul' : 'Estudando'}
    </span>
  );
  /* avatar por aluno (iniciais do próprio); a cor da família é a mesma nos irmãos */
  const avatarFor = (name: string, sm?: boolean) => (
    <div
      className={`${sm ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm'} rounded-xl grid place-content-center text-white font-semibold shrink-0`}
      style={{ background: avatarGrad(s.id), ...(inactive ? { filter: 'grayscale(.7)' } : {}) }}
    >
      {initials(name)}
    </div>
  );
  const avatar = avatarFor(s.kids[0].n);
  /* célula "Aluno": 1 aluno = formato normal; irmãos no mesmo contrato = um bloco
     por aluno (avatar + nome + idade), alinhado com os blocos de turma. Sem "+1". */
  const alunoCell = (sm: boolean) =>
    multi ? (
      <div className="min-w-0 space-y-1.5">
        {s.kids.map((k, i) => (
          <div key={i} className="flex items-center gap-2.5 min-w-0 min-h-[42px]">
            {avatarFor(k.n, true)}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate flex items-center gap-1.5">
                {k.n}
                {i === 0 && <MediaIcon media={s.media} />}
              </p>
              <p className="text-[11px] text-[var(--muted)] truncate">
                {k.age} anos · {s.addr.bairro}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className={sm ? 'flex items-start gap-3 min-w-0' : 'flex items-center gap-3 min-w-0'}>
        {avatar}
        <div className="min-w-0">
          <p className={sm ? 'font-medium flex items-center gap-1.5 flex-wrap leading-snug' : 'font-medium flex items-center gap-2 truncate'}>
            {s.kids[0].n}
            <MediaIcon media={s.media} />
          </p>
          <p className={`text-xs text-[var(--muted)] ${sm ? 'mt-0.5' : ''}`}>
            {s.kids[0].age} anos · {s.addr.bairro}
          </p>
        </div>
      </div>
    );
  const kebab = (
    <button
      onClick={(e) => onMenu(e, s.id)}
      data-tip="Todas as ações"
      className="w-9 h-9 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--card)] transition shrink-0"
    >
      <MoreVertical className="w-4 h-4 text-[var(--muted)]" />
    </button>
  );
  /* "na escola desde" ≠ data da matrícula: a matrícula é só a última rematrícula */
  const sinceCell = s.since ? (
    <span className="text-xs whitespace-nowrap" data-tip={`Aluno da escola desde ${s.since}`}>
      Desde {s.since}
    </span>
  ) : (
    <span className="text-xs text-[var(--muted)]" data-tip="Sem registro — use ⋮ → Editar dados para preencher">
      —
    </span>
  );
  const mobKids = [...new Map(s.kids.map((k) => [k.tid || 0, k])).values()];
  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer transition md:border-b md:last:border-0 hover:bg-[var(--hover)] ${inactive ? 'opacity-60' : ''}`}
      style={{ borderColor: 'var(--border)', ...(famGroup && fam > 1 ? { boxShadow: 'inset 3px 0 0 #2F539A' } : {}) }}
    >
      {/* desktop: linha da tabela */}
      <div className={`hidden md:grid md:grid-cols-[1.45fr_1.1fr_1fr_.8fr_.7fr_.85fr_.8fr_52px] gap-3 px-5 py-3.5 ${multi ? 'items-start' : 'items-center'}`}>
        {alunoCell(false)}
        <div className={`min-w-0 ${multi ? 'pt-1' : ''}`}>
          <p className="text-sm truncate flex items-center gap-1.5">
            {s.resp.n}
            <FamBadge s={s} />
          </p>
          <p className="text-xs text-[var(--muted)]">
            {s.resp.rel} · {s.resp.phone}
          </p>
        </div>
        <div className="min-w-0">
          <TurmaCell s={s} />
        </div>
        <div>
          <StatusBadge status={s.status} />
        </div>
        <div>{actPill}</div>
        <div>{sinceCell}</div>
        <div>
          <p className="text-xs whitespace-nowrap">{s.date}</p>
          <p className="text-[10px] text-[var(--muted)]">às {s.hora || '—'}</p>
        </div>
        <div className="flex items-center justify-end">{kebab}</div>
      </div>
      {/* mobile: card */}
      <div className="md:hidden p-4">
        <div className="flex items-start gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            {multi ? (
              <>
                {s.kids.map((k, i) => (
                  <p key={i} className={`font-medium text-sm flex items-center gap-1.5 leading-snug ${i > 0 ? 'mt-1' : ''}`}>
                    {k.n} <span className="text-[var(--muted)] font-normal">{k.age}a</span>
                    {i === 0 && <MediaIcon media={s.media} />}
                  </p>
                ))}
                <p className="text-xs text-[var(--muted)] mt-0.5">{s.addr.bairro}</p>
              </>
            ) : (
              <>
                <p className="font-medium flex items-center gap-1.5 flex-wrap leading-snug">
                  {s.kids[0].n}
                  <MediaIcon media={s.media} />
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {s.kids[0].age} anos · {s.addr.bairro}
                </p>
              </>
            )}
          </div>
          {kebab}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {mobKids.map((k, i) => (
            <KidTurmaChip key={i} k={k} />
          ))}
          <StatusBadge status={s.status} />
          {actPill}
          {s.since && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ color: 'var(--muted)', background: 'var(--hover)' }}>
              Desde {s.since}
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-3 mt-3 pt-3 border-t text-xs text-[var(--muted)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="truncate flex items-center gap-1.5 min-w-0">
            {s.resp.n}
            <FamBadge s={s} />
          </span>
          <span className="whitespace-nowrap shrink-0">
            {s.date}
            {s.hora ? ' · ' + s.hora : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

/* paginação numerada com janela de até 5 páginas (port pagerHTML l.2121) */
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
