import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Backpack,
  Cake,
  Calendar,
  CalendarDays,
  CalendarX,
  DoorClosed,
  DoorOpen,
  Expand,
  FileCheck2,
  FileClock,
  Gift,
  GraduationCap,
  Hourglass,
  Lightbulb,
  RefreshCcw,
  Sheet,
  Sun,
  Sunset,
  TrendingUp,
  UserPlus,
  UserRoundX,
  Users,
  UsersRound,
} from 'lucide-react';
import { initials, useAuth } from '../../lib/dashboard/auth';
import { useDash, logAct } from '../../lib/dashboard/store';
import { useTheme } from '../../lib/dashboard/theme';
import {
  FAMS,
  NIVEIS,
  SALAS,
  STUDENTS,
  TEACHERS,
  TURMAS,
  activeKidsIn,
  dvNum,
  famC,
  horaPeriodo,
  isFuture,
  isNovo,
  isStale,
  kidTurma,
  needsAction,
  needsSignature,
  palette,
  PERIOD_DATA,
  salaById,
  semTurmaKids,
  teacherAlunos,
  type Student,
} from '../../lib/dashboard/data';
import { CSelect } from '../../components/dashboard/ui/CSelect';
import { useToast } from '../../components/dashboard/ui/Toast';
import { WAIcon } from '../../components/dashboard/ui/icons';
import { STATUS_INK } from './alunos/common';
import { exportStudentsCSV } from './alunos/exportCsv';
import { ChartShell } from '../../components/dashboard/charts/base';
import { EnrollChart, type PeriodKey } from '../../components/dashboard/charts/EnrollChart';
import { AgeChart } from '../../components/dashboard/charts/AgeChart';
import { HoursChart } from '../../components/dashboard/charts/HoursChart';
import { DonutChart } from '../../components/dashboard/charts/DonutChart';

/* Tela VISÃO GERAL — port 1:1 da seção data-view="overview" do dashboard.html
   (markup l.417–626; refreshOverviewData/setOvCohort l.3429–3468; widgets
   renderHealth/renderVagas/renderNiveis/renderMovimento/renderHoods/
   renderBirthdays l.2470–2566; renderRecent l.2236; renderOpsStats l.3470–3549).
   Os números são TODOS derivados da base mock (mesma seed do preview). */

type Cohort = '' | 'on' | 'next';

/* estado da tela sobrevive à navegação (mesmo padrão de cache de Alunos.tsx) */
const cache = { cohort: '' as Cohort, period: '6m' as PeriodKey };

/* barra de progresso em bloco (health/vagas/níveis/bairros) */
function BlockBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--hover)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(pct))}%`, background: color }} />
    </div>
  );
}

/* barra inline flex-1 (ops stats, l.3473) */
function InlineBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--hover)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round(pct))}%`, background: color }} />
    </div>
  );
}

export default function Overview() {
  useDash();
  const { dark } = useTheme();
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const who = effectiveUser?.name ?? 'Equipe';
  const first = (effectiveUser?.name ?? '').split(' ')[0];

  const [cohort, setCohortState] = useState<Cohort>(cache.cohort);
  const [period, setPeriodState] = useState<PeriodKey>(cache.period);
  const setCohort = (v: Cohort) => {
    cache.cohort = v;
    setCohortState(v);
  };
  const setPeriod = (v: PeriodKey) => {
    cache.period = v;
    setPeriodState(v);
  };

  const goAgenda = () => navigate('/dashboard/agenda');
  const goAlunos = () => navigate('/dashboard/alunos');
  const openDetail = (sid: number) => navigate(`/dashboard/alunos/${sid}`);
  /* port de goPendentes (l.3550) — leva à lista de alunos para cobrar pelo ⋮ */
  const goPendentes = () => {
    goAlunos();
    toast('Mostrando os contratos pendentes — use o menu ⋮ de cada linha para cobrar.');
  };
  const doExport = () => {
    exportStudentsCSV(STUDENTS);
    logAct(who, `Exportou a planilha de alunos (${STUDENTS.length} matrículas)`);
    toast(`Planilha exportada com ${STUDENTS.length} matrícula${STUDENTS.length > 1 ? 's' : ''}!`);
  };

  /* ====== derivação da base (port refreshOverviewData l.3438) ====== */
  const allAct = STUDENTS.filter((s) => s.active !== false);
  const act = allAct.filter((s) => cohort === '' || (cohort === 'on' ? !isFuture(s) : isFuture(s)));
  const inCohort = (s: Student) => s.active !== false && (cohort === '' || (cohort === 'on' ? !isFuture(s) : isFuture(s)));
  const actKids = act.flatMap((s) => s.kids);
  const futKids = allAct.filter(isFuture).reduce((a, s) => a + s.kids.length, 0);
  const allKids = allAct.reduce((a, s) => a + s.kids.length, 0);

  const kpiActive = actKids.length;
  const kpiActiveSub = `${allKids - futKids} estudando · ${futKids} começam em Jul`;
  const kpiWeek = act.filter((s) => { const d = dvNum(s); return d >= 20260528 && d <= 20260603; }).length;
  const kpiPending = act.filter(needsSignature).length;
  const kpiMonth = act.filter((s) => dvNum(s) >= 20260601).length;

  const stAge = (actKids.reduce((a, k) => a + k.age, 0) / (actKids.length || 1)).toFixed(1).replace('.', ',') + ' anos';
  const famCnt: Record<string, number> = {};
  act.forEach((s) => { famCnt[s.resp.cpf] = (famCnt[s.resp.cpf] || 0) + s.kids.length; });
  const stFam = Object.values(famCnt).filter((n) => n > 1).length + ' famílias';
  const totCap = TURMAS.reduce((a, t) => a + t.cap, 0);
  const emTurma = allAct.reduce((a, s) => a + s.kids.filter((k) => k.tid).length, 0);
  const stOcc = Math.round((emTurma / (totCap || 1)) * 100) + '%';
  const stSemTurma = semTurmaKids().length;
  const stSigned = Math.round((act.filter((s) => s.status === 'signed').length / (act.length || 1)) * 100) + '%';
  const stNext = futKids + (futKids === 1 ? ' aluno' : ' alunos');

  /* ====== funil dos contratos (port renderHealth l.2507) ====== */
  const by = (k: Student['status']) => act.filter((s) => s.status === k).length;
  const healthData = [
    { t: 'Assinados', v: by('signed'), c: '#16a34a' },
    { t: 'Visualizados, falta assinar', v: by('viewed'), c: '#7C3AED' },
    { t: 'Enviados, sem abrir', v: by('sent'), c: '#2F539A' },
    { t: 'Pendentes de envio', v: by('pending'), c: '#B5860B' },
  ];
  const stale = act.filter(isStale).length;
  const acao = act.filter(needsAction).length;

  /* ====== ocupação por sala (port renderVagas l.2524 — não filtra por coorte) ====== */
  const occBySala: Record<string, number> = {};
  const capBySala: Record<string, number> = {};
  let totOcc = 0;
  TURMAS.forEach((t) => {
    const v = activeKidsIn(t.id);
    capBySala[t.sala] = (capBySala[t.sala] || 0) + t.cap;
    occBySala[t.sala] = (occBySala[t.sala] || 0) + v;
    totOcc += v;
  });
  const vagasRows = SALAS.filter((s) => capBySala[s.id])
    .map((s) => ({ s, v: occBySala[s.id] || 0, cap: capBySala[s.id] }))
    .sort((a, b) => b.v / b.cap - a.v / a.cap);
  const vagasChip = `${Math.max(0, totCap - totOcc)} vagas livres`;

  /* ====== faixa etária (port l.3466) ====== */
  const ageBuckets = [0, 0, 0, 0, 0];
  actKids.forEach((k) => { ageBuckets[k.age <= 6 ? 0 : k.age <= 9 ? 1 : k.age <= 12 ? 2 : k.age <= 15 ? 3 : 4]++; });

  /* ====== aniversariantes (port renderBirthdays l.2470 — ref. 03/06) ====== */
  const REF = 6 * 100 + 3;
  const bdays: { n: string; d: number; m: number; age: number; sid: number; order: number }[] = [];
  STUDENTS.filter(inCohort).forEach((s) =>
    s.kids.forEach((k) => {
      const [d, m] = k.b.split('/').map(Number);
      if (!d || !m) return;
      const key = m * 100 + d;
      bdays.push({ n: k.n, d, m, age: k.age + 1, sid: s.id, order: key >= REF ? key : key + 1200 });
    }),
  );
  bdays.sort((a, b) => a.order - b.order);

  /* ====== últimas matrículas (port renderRecent l.2236) ====== */
  const recent = STUDENTS.slice(0, 6);

  /* ====== distribuição por horário (port l.3462) ====== */
  const kidsByPar = (p: 'seg-qua' | 'ter-qui') => act.reduce((a, s) => a + s.kids.filter((k) => kidTurma(k)?.par === p).length, 0);
  const nSq = kidsByPar('seg-qua');
  const nTq = kidsByPar('ter-qui');

  /* ====== alunos por nível (port renderNiveis l.2539) ====== */
  const nivCnt: Record<string, number> = {};
  STUDENTS.forEach((s) => {
    if (!inCohort(s)) return;
    s.kids.forEach((k) => { const t = kidTurma(k); if (t) nivCnt[t.nivel] = (nivCnt[t.nivel] || 0) + 1; });
  });
  const nivData = NIVEIS.filter((n) => nivCnt[n.k]).map((n) => ({ n, v: nivCnt[n.k] }));
  const nivMax = Math.max(1, ...nivData.map((d) => d.v));

  /* ====== entradas × saídas por sala (port renderMovimento l.2552) ====== */
  const eIn: Record<string, number> = {};
  const eOut: Record<string, number> = {};
  STUDENTS.forEach((s) => {
    s.kids.forEach((k) => {
      const t = kidTurma(k);
      if (!t) return;
      if (s.active === false) { if (s.exit) eOut[t.sala] = (eOut[t.sala] || 0) + 1; }
      else if (dvNum(s) >= 20260101) eIn[t.sala] = (eIn[t.sala] || 0) + 1;
    });
  });
  const movRows = SALAS.filter((s) => eIn[s.id] || eOut[s.id])
    .map((s) => ({ s, i: eIn[s.id] || 0, o: eOut[s.id] || 0 }))
    .sort((a, b) => b.i + b.o - (a.i + a.o))
    .slice(0, 7);

  /* ====== ops stats (port renderOpsStats l.3470) ====== */
  const tRows = TEACHERS.map((p) => ({ p, sala: SALAS.find((s) => s.prof === p), n: teacherAlunos(p) })).sort((a, b) => b.n - a.n);
  const semProfSalas = SALAS.filter((s) => !s.prof && TURMAS.some((t) => t.sala === s.id));
  const semProfAlunos = semProfSalas.reduce((a, s) => a + TURMAS.filter((t) => t.sala === s.id).reduce((x, t) => x + activeKidsIn(t.id), 0), 0);
  const maxT = Math.max(1, ...tRows.map((r) => r.n));

  const nivRows = NIVEIS.map((nv) => {
    const ts = TURMAS.filter((t) => t.nivel === nv.k);
    if (!ts.length) return null;
    const cap = ts.reduce((a, t) => a + t.cap, 0);
    const occ = ts.reduce((a, t) => a + activeKidsIn(t.id), 0);
    return { nv, cap, occ, vagas: cap - occ };
  }).filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => a.vagas - b.vagas);

  const cheias = TURMAS.filter((t) => activeKidsIn(t.id) >= t.cap).length;
  const extras = TURMAS.filter((t) => t.cap > 7).length;
  const fila = semTurmaKids().length;

  const part = (p: 'm' | 't') => {
    const ts = TURMAS.filter((t) => horaPeriodo(t.hora) === p);
    return { n: ts.length, cap: ts.reduce((a, t) => a + t.cap, 0), occ: ts.reduce((a, t) => a + activeKidsIn(t.id), 0) };
  };
  const man = part('m');
  const tar = part('t');

  /* ====== raio-X das saídas (port l.3524) ====== */
  const exits = STUDENTS.filter((s) => s.active === false && s.exit);
  const exitKids = exits.reduce((a, s) => a + s.kids.length, 0);
  const byReason: Record<string, number> = {};
  exits.forEach((s) => { byReason[s.exit!.label] = (byReason[s.exit!.label] || 0) + s.kids.length; });
  const reasons = Object.entries(byReason).sort((a, b) => b[1] - a[1]);
  const maxR = Math.max(1, ...reasons.map((r) => r[1]));
  const MES: Record<string, string> = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
  const byMonth: Record<string, number> = {};
  exits.forEach((s) => { const [, m2, y] = s.exit!.date.split('/'); const k = `${MES[m2]}/${y.slice(2)}`; byMonth[k] = (byMonth[k] || 0) + s.kids.length; });
  const topMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  const bySala: Record<string, number> = {};
  exits.forEach((s) => s.kids.forEach((k) => { const t = kidTurma(k); if (t) bySala[t.sala] = (bySala[t.sala] || 0) + 1; }));
  const topSala = Object.entries(bySala).sort((a, b) => b[1] - a[1])[0];
  const tsTop = topSala ? salaById(topSala[0]) : null;
  const entradas = STUDENTS.filter((s) => s.active !== false && isNovo(s)).reduce((a, s) => a + s.kids.length, 0);

  /* ====== bairros (port renderHoods l.2487) ====== */
  const hoodCnt: Record<string, number> = {};
  STUDENTS.forEach((s) => { if (!inCohort(s)) return; hoodCnt[s.addr.bairro] = (hoodCnt[s.addr.bairro] || 0) + s.kids.length; });
  const hoods = Object.entries(hoodCnt).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const hoodMax = hoods[0]?.[1] || 1;

  /* ====== autorização de imagem (port payData l.2498) ====== */
  let payYes = 0, payNo = 0;
  STUDENTS.forEach((s) => { if (!inCohort(s)) return; if (s.media !== false) payYes += s.kids.length; else payNo += s.kids.length; });
  const pay: [string, number, string][] = [['Autorizam fotos', payYes, '#2F539A'], ['Não autorizam', payNo, '#F5B700']];

  const p = PERIOD_DATA[period];
  const cohortBtn = (k: Cohort, label: string, id: string) => (
    <button
      key={id}
      onClick={() => setCohort(k)}
      className={'px-3 py-1.5 rounded-lg ' + (k === cohort ? 'bg-[var(--card)] shadow-sm font-medium' : 'text-[var(--muted)]')}
    >
      {label}
    </button>
  );

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Visão geral</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">{`Olá, ${first}! Aqui está o resumo da escola.`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center bg-[var(--hover)] rounded-xl p-1 text-sm"
            data-tour="cohort"
            data-tip="Separa quem já está estudando de quem fez matrícula para o próximo período"
          >
            {cohortBtn('', 'Todos', 'ovcAll')}
            {cohortBtn('on', 'Estudando', 'ovcOn')}
            {cohortBtn('next', '2026.2', 'ovcNext')}
          </div>
          <CSelect
            value={period}
            items={[
              { v: '6m', l: 'Últimos 6 meses' },
              { v: 'ano', l: 'Últimos 12 meses' },
              { v: 'mes', l: 'Este mês' },
            ]}
            onChange={(v) => setPeriod(v as PeriodKey)}
            icon={<Calendar className="w-4 h-4 text-[var(--muted)]" />}
            ariaLabel="Período dos gráficos"
          />
          <button
            onClick={doExport}
            data-tour="export"
            data-tip="Baixa uma planilha com todos os alunos (abre no Excel ou Google Planilhas)"
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold"
            style={{ background: '#1E3765' }}
          >
            <Sheet className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar planilha</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:col-span-3" data-tour="kpis">
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Alunos ativos</span>
            <div className="w-9 h-9 rounded-xl grid place-content-center" style={{ background: 'var(--hover)' }}>
              <GraduationCap className="w-[18px] h-[18px] text-brand-light" />
            </div>
          </div>
          <p className="font-heading text-3xl font-semibold mt-3">{kpiActive}</p>
          <p className="text-xs mt-1 text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> <span>{kpiActiveSub}</span>
          </p>
        </div>
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Novos esta semana</span>
            <div className="w-9 h-9 rounded-xl grid place-content-center" style={{ background: 'var(--hover)' }}>
              <UserPlus className="w-[18px] h-[18px] text-brand-light" />
            </div>
          </div>
          <p className="font-heading text-3xl font-semibold mt-3">{kpiWeek}</p>
          <p className="text-xs mt-1 text-[var(--muted)] font-medium">matrículas de 28/05 a 03/06</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Contratos pendentes</span>
            <div className="w-9 h-9 rounded-xl grid place-content-center" style={{ background: '#FFF6DC' }}>
              <FileClock className="w-[18px] h-[18px]" style={{ color: '#B5860B' }} />
            </div>
          </div>
          <p className="font-heading text-3xl font-semibold mt-3">{kpiPending}</p>
          <p className="text-xs mt-1 text-[var(--muted)] font-medium">aguardando envio ou assinatura</p>
        </div>
        <div className="surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Matrículas no mês</span>
            <div className="w-9 h-9 rounded-xl grid place-content-center" style={{ background: 'var(--hover)' }}>
              <TrendingUp className="w-[18px] h-[18px] text-brand-light" />
            </div>
          </div>
          <p className="font-heading text-3xl font-semibold mt-3">{kpiMonth}</p>
          <p className="text-xs mt-1 text-emerald-500 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> junho em andamento
          </p>
        </div>
      </div>

      {/* mini-indicadores (calculados da base) */}
      <div className="surface rounded-2xl mt-4 px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm lg:col-span-3" data-tour="strip">
        <span className="flex items-center gap-2">
          <Cake className="w-4 h-4 text-brand-light" />Média de idade <strong>{stAge}</strong>
        </span>
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-light" /><strong>{stFam}</strong> com irmãos matriculados
        </span>
        <span className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-brand-light" />Ocupação das turmas <strong>{stOcc}</strong>
        </span>
        <span
          onClick={goAgenda}
          className="flex items-center gap-2 cursor-pointer hover:underline"
          data-tip="Alunos matriculados que ainda não foram colocados numa turma — toque para alocar na Agenda"
        >
          <Hourglass className="w-4 h-4" style={{ color: '#B5860B' }} />
          <strong style={{ color: '#B5860B' }}>{stSemTurma}</strong> aguardando turma
        </span>
        <span className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-brand-light" />Contratos assinados <strong>{stSigned}</strong>
        </span>
        <span className="flex items-center gap-2">
          <Backpack className="w-4 h-4" style={{ color: '#2F539A' }} />
          <strong style={{ color: '#2F539A' }}>{stNext}</strong> começam em Jul (2026.2)
        </span>
        <span className="flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-brand-light" />Rematrículas do semestre <strong>91%</strong>
        </span>
      </div>

      {/* matrículas + andamento dos contratos */}
      <div className="dash-row grid lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 lg:col-span-2" data-tour="enroll">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Matrículas</h3>
              <p className="text-xs text-[var(--muted)]">{p.sub}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{p.chip}</span>
          </div>
          <ChartShell className="h-60">
            <EnrollChart period={period} dark={dark} />
          </ChartShell>
          <div className="flex items-center gap-5 mt-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full" style={{ background: '#2F539A' }} /> Novas matrículas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full" style={{ background: '#F5B700' }} /> Rematrículas
            </span>
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="health">
          <h3 className="font-heading font-semibold text-lg mb-1">Andamento dos contratos</h3>
          <p className="text-xs text-[var(--muted)] mb-4">{`${act.length} matrículas ativas · o Autentique atualiza sozinho`}</p>
          <div className="flex-1 flex flex-col justify-evenly gap-4">
            {healthData.map((x) => (
              <div key={x.t}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{x.t}</span>
                  <span className="font-semibold" style={{ color: x.c }}>{x.v}</span>
                </div>
                <BlockBar pct={(x.v / (act.length || 1)) * 100} color={x.c} />
              </div>
            ))}
            {stale > 0 && (
              <p className="text-xs font-semibold flex items-center gap-1.5 mt-1" style={{ color: '#DC2626' }}>
                <FileClock className="w-3.5 h-3.5 shrink-0" />
                {`${stale} contrato${stale > 1 ? 's' : ''} parado${stale > 1 ? 's' : ''} há 7+ dias sem assinatura`}
              </p>
            )}
            {acao > 0 && (
              <p className="text-xs font-semibold flex items-center gap-1.5 mt-1" style={{ color: '#DC2626' }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {`${acao} contrato${acao > 1 ? 's' : ''} precisa${acao > 1 ? 'm' : ''} de ação (recusado / falha no envio)`}
              </p>
            )}
            <button
              onClick={goPendentes}
              className="mt-1 w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition hover:brightness-105"
              style={{ background: '#25D366' }}
            >
              <WAIcon className="w-4 h-4" /> Cobrar pendentes no WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ocupação por sala + faixa etária */}
      <div className="dash-row grid lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 lg:col-span-2 flex flex-col" data-tour="vagas">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Ocupação por sala</h3>
              <p className="text-xs text-[var(--muted)]">
                Turmas de até 7 alunos · capacidade total de <span>{totCap}</span> lugares
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap" style={{ background: 'rgba(22,163,74,.10)', color: '#16a34a' }}>
                {vagasChip}
              </span>
              <button
                onClick={goAgenda}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--hover)] transition"
                data-tip="Abrir a Agenda — criar turmas, mover alunos e ver as salas"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Abrir agenda</span>
              </button>
            </div>
          </div>
          <div className="flex-1 content-center grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {vagasRows.map(({ s, v, cap }) => {
              const full = v >= cap;
              return (
                <div key={s.id} className="cursor-pointer" onClick={goAgenda} data-tip={`Abrir a ${s.n} na Agenda`}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.c }} />
                      {s.n}
                      {full && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded align-middle" style={{ background: 'rgba(245,183,0,.22)', color: '#B5860B' }}>
                          CHEIA
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--muted)]">{v}/{cap}</span>
                  </div>
                  <BlockBar pct={(v / cap) * 100} color={s.c} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted)] mt-auto pt-4 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: '#F5B700' }} />
            <span>
              Na <b>Agenda</b> dá para ver cada sala como no quadro do Canva — e mover alunos em 2 cliques.
            </span>
          </p>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col">
          <h3 className="font-heading font-semibold text-lg mb-1">Faixa etária</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Idade dos alunos</p>
          <ChartShell className="h-56">
            <AgeChart data={ageBuckets} dark={dark} />
          </ChartShell>
        </div>
      </div>

      {/* aniversariantes + últimas matrículas */}
      <div className="dash-row grid lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="bday">
          <h3 className="font-heading font-semibold text-lg mb-1">Próximos aniversariantes 🎂</h3>
          <p className="text-xs text-[var(--muted)] mb-3">Os 5 próximos da fila</p>
          <div className="flex-1 flex flex-col justify-evenly gap-1">
            {bdays.slice(0, 5).map((x, i) => (
              <div key={i} onClick={() => openDetail(x.sid)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--hover)] cursor-pointer transition">
                <div
                  className="w-10 h-10 rounded-xl grid place-content-center font-heading font-semibold text-[13px] shrink-0"
                  style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}
                >
                  {String(x.d).padStart(2, '0')}/{String(x.m).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{x.n}</p>
                  <p className="text-xs text-[var(--muted)]">faz {x.age} anos</p>
                </div>
                <Gift className="w-4 h-4 shrink-0" style={{ color: '#F5B700' }} />
              </div>
            ))}
            <button
              onClick={() => toast('Mensagens de parabéns preparadas!')}
              className="mt-2 w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--hover)] transition"
            >
              <span style={{ color: '#1faa53' }}>
                <WAIcon className="w-4 h-4" />
              </span>{' '}
              Enviar parabéns
            </button>
          </div>
        </div>
        <div className="surface rounded-2xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg">Últimas matrículas</h3>
            <button onClick={goAlunos} className="text-sm font-medium text-brand-light hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-evenly">
            {recent.map((s) => {
              const st = STATUS_INK[s.status];
              const label = { signed: 'Assinado', viewed: 'Visualizado', sent: 'Enviado', pending: 'Pendente', rejected: 'Recusado', failed: 'Falha no envio' }[s.status];
              return (
                <div key={s.id} onClick={() => openDetail(s.id)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--hover)] cursor-pointer transition">
                  <div
                    className="w-9 h-9 rounded-lg grid place-content-center text-white text-xs font-semibold"
                    style={{ background: `linear-gradient(135deg,${palette[s.id % palette.length]},#2F539A)` }}
                  >
                    {initials(s.kids[0].n)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.kids[0].n}</p>
                    <p className="text-xs text-[var(--muted)]">{s.resp.n} · {s.date}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: st.c, background: st.bg }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* horário das matrículas + distribuição por horário */}
      <div className="dash-row grid lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 lg:col-span-2 flex flex-col" data-tour="hours">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Que horas o pessoal matricula?</h3>
              <p className="text-xs text-[var(--muted)]">Horário em que as matrículas chegam pelo site</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}>
              Pico: 20h
            </span>
          </div>
          <ChartShell className="h-64">
            <HoursChart dark={dark} />
          </ChartShell>
          <p className="text-xs text-[var(--muted)] mt-auto pt-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: '#F5B700' }} /> A maioria das famílias matricula à noite — bom horário para
            impulsionar posts e responder rápido no WhatsApp.
          </p>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col">
          <h3 className="font-heading font-semibold text-lg mb-1">Distribuição por horário</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Dias das aulas</p>
          <ChartShell className="h-44">
            <DonutChart labels={['Seg/Qua', 'Ter/Qui']} data={[nSq, nTq]} colors={['#2F539A', '#F5B700']} cutout="68%" />
          </ChartShell>
          <div className="mt-auto pt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: '#2F539A' }} />Seg/Qua
              </span>
              <span className="font-semibold">{nSq}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: '#F5B700' }} />Ter/Qui
              </span>
              <span className="font-semibold">{nTq}</span>
            </div>
          </div>
        </div>
      </div>

      {/* alunos por nível + entradas × saídas */}
      <div className="dash-row grid lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 lg:col-span-2 flex flex-col" data-tour="niveis">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Alunos por nível</h3>
              <p className="text-xs text-[var(--muted)]">Quantos alunos estudam em cada nível — só os níveis com turma neste semestre</p>
            </div>
            <button onClick={goAgenda} className="text-sm font-medium text-brand-light hover:underline flex items-center gap-1 whitespace-nowrap">
              Ver na agenda <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 grid sm:grid-cols-2 gap-x-10 gap-y-3 content-center">
            {nivData.length ? (
              nivData.map(({ n, v }) => (
                <div key={n.k}>
                  <div className="flex justify-between gap-3 text-sm mb-1.5">
                    <span className="font-medium truncate" style={{ color: FAMS[n.fam].c }}>{n.n}</span>
                    <span className="text-[var(--muted)] whitespace-nowrap shrink-0">{v} aluno{v === 1 ? '' : 's'}</span>
                  </div>
                  <BlockBar pct={(v / nivMax) * 100} color={FAMS[n.fam].c} />
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Sem alunos alocados em turmas ainda.</p>
            )}
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="movimento">
          <h3 className="font-heading font-semibold text-lg mb-1">Entradas × saídas</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Por sala, no semestre — entradas são matrículas novas; saídas, desligamentos da escola</p>
          <div className="flex-1 flex flex-col justify-evenly gap-1.5">
            {movRows.length ? (
              movRows.map(({ s, i, o }) => (
                <div key={s.id} className="flex items-center gap-2.5 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.c }} />
                  <span className="font-medium flex-1 truncate">{s.n.replace(' Room', '')}</span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                    data-tip={`${i} aluno${i === 1 ? '' : 's'} de matrículas novas de 2026`}
                    style={{ color: '#16a34a', background: 'rgba(22,163,74,.10)' }}
                  >
                    +{i}
                  </span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                    data-tip={`${o} aluno${o === 1 ? '' : 's'} desligado${o === 1 ? '' : 's'} da escola`}
                    style={{ color: '#DC2626', background: 'rgba(220,38,38,.08)' }}
                  >
                    −{o}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Sem movimento registrado.</p>
            )}
          </div>
        </div>
      </div>

      {/* teachers + vagas por nível + radar da agenda */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="ov-teachers">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading font-semibold text-lg">Alunos por teacher</h3>
            <button onClick={goAgenda} className="text-sm font-medium text-brand-light hover:underline whitespace-nowrap">
              Gerenciar
            </button>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">Pela sala de cada teacher no semestre</p>
          <div className="flex-1 flex flex-col justify-evenly gap-2">
            {tRows.map((r) => (
              <div key={r.p} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.sala ? r.sala.c : '#94a3b8' }} />
                <span className="text-sm font-medium w-[110px] truncate" data-tip={r.sala ? r.sala.n : 'sem sala por enquanto'}>
                  {r.p}
                </span>
                <InlineBar pct={(r.n / maxT) * 100} color={r.sala ? r.sala.c : '#94a3b8'} />
                <span className="text-sm font-semibold w-7 text-right">{r.n}</span>
              </div>
            ))}
            {semProfSalas.length > 0 && (
              <p className="text-[11px] text-[var(--muted)] pt-1.5 border-t mt-1" style={{ borderColor: 'var(--border)' }}>
                + {semProfSalas.length} sala{semProfSalas.length > 1 ? 's' : ''} sem teacher ({semProfAlunos} aluno{semProfAlunos === 1 ? '' : 's'})
              </p>
            )}
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="ov-vagas-nivel">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading font-semibold text-lg">Vagas por nível</h3>
            <button onClick={goAgenda} className="text-sm font-medium text-brand-light hover:underline flex items-center gap-1 whitespace-nowrap">
              Ver na agenda <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">"Onde tem vaga?" — os quase lotados primeiro</p>
          <div className="flex-1 flex flex-col justify-evenly gap-1.5">
            {nivRows.map((r) => (
              <div
                key={r.nv.k}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-[var(--hover)] -mx-1.5 px-1.5 py-0.5 rounded-lg transition"
                onClick={goAgenda}
              >
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap w-[96px] text-center truncate shrink-0"
                  style={{ background: `${famC(r.nv.k)}1a`, color: famC(r.nv.k) }}
                >
                  {r.nv.n}
                </span>
                <InlineBar pct={(r.occ / (r.cap || 1)) * 100} color={famC(r.nv.k)} />
                <span className="text-[11px] font-bold whitespace-nowrap w-14 text-right" style={{ color: r.vagas === 0 ? '#16a34a' : 'var(--muted)' }}>
                  {r.vagas === 0 ? 'lotado' : `${r.vagas} vaga${r.vagas > 1 ? 's' : ''}`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="ov-radar">
          <h3 className="font-heading font-semibold text-lg mb-1">Radar da agenda</h3>
          <p className="text-xs text-[var(--muted)] mb-4">O que merece um olho hoje — toque para resolver</p>
          <div className="flex-1 flex flex-col justify-evenly gap-1.5">
            {[
              { Ic: UsersRound, label: 'Alunos aguardando turma', n: fila, tone: '#B5860B' },
              { Ic: DoorClosed, label: 'Turmas lotadas', n: cheias, tone: '#16a34a' },
              { Ic: Expand, label: 'Turmas com vaga extra aberta (limite acima de 7)', n: extras, tone: '#7C3AED' },
              { Ic: UserRoundX, label: 'Salas com turma e sem teacher', n: semProfSalas.length, tone: '#DC2626' },
            ].map(({ Ic, label, n, tone }) => (
              <div key={label} onClick={goAgenda} className="flex items-center gap-2.5 cursor-pointer hover:bg-[var(--hover)] -mx-1.5 px-1.5 py-1.5 rounded-lg transition">
                <div className="w-8 h-8 rounded-lg grid place-content-center shrink-0" style={{ background: `${tone}1a` }}>
                  <Ic className="w-4 h-4" style={{ color: tone }} />
                </div>
                <span className="text-sm flex-1 leading-snug">{label}</span>
                <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: `${tone}1a`, color: tone }}>
                  {n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* manhã × tarde + raio-X das saídas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 flex flex-col" data-tour="ov-periodos">
          <h3 className="font-heading font-semibold text-lg mb-1">Manhã × tarde</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Ocupação das turmas por período</p>
          <div className="flex-1 flex flex-col justify-center gap-5">
            {[
              { label: 'Manhã', Ic: Sun, d: man, color: '#F5B700' },
              { label: 'Tarde', Ic: Sunset, d: tar, color: '#2F539A' },
            ].map(({ label, Ic, d, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Ic className="w-4 h-4" style={{ color }} />
                    {label}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {d.occ} aluno{d.occ === 1 ? '' : 's'} · {d.n} turma{d.n === 1 ? '' : 's'} · {Math.round((d.occ / (d.cap || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--hover)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((d.occ / (d.cap || 1)) * 100)}%`, background: color }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[var(--muted)]">A manhã existe, mas é menor — vagas livres de manhã são oportunidade de turma nova.</p>
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col lg:col-span-2" data-tour="ov-saidas">
          <h3 className="font-heading font-semibold text-lg mb-1">Raio-X das saídas</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Por que as famílias saem, quando saem e de onde — desligamentos da escola no período</p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-2">
              {reasons.length ? (
                reasons.map(([l, n]) => (
                  <div key={l} className="flex items-center gap-2.5">
                    <span className="text-xs w-[150px] truncate" data-tip={l}>
                      {l}
                    </span>
                    <InlineBar pct={(n / maxR) * 100} color="#DC2626" />
                    <span className="text-xs font-semibold w-5 text-right">{n}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">Nenhum desligamento no período. 🎉</p>
              )}
            </div>
            <div className="space-y-2.5">
              {[
                { Ic: UsersRound, label: 'Saídas no período', value: `${exitKids} aluno${exitKids === 1 ? '' : 's'} (${exits.length} famíli${exits.length === 1 ? 'a' : 'as'})` },
                { Ic: CalendarX, label: 'Mês com mais saídas', value: topMonth ? `${topMonth[0]} (${topMonth[1]})` : '—' },
                { Ic: DoorOpen, label: 'Sala que mais perdeu alunos', value: tsTop ? `${tsTop.n}${tsTop.prof ? ' · Teacher ' + tsTop.prof : ''} (${topSala[1]})` : '—' },
                { Ic: TrendingUp, label: 'Entradas no mesmo período', value: `${entradas} alunos novos` },
              ].map(({ Ic, label, value }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg grid place-content-center shrink-0" style={{ background: 'var(--hover)' }}>
                    <Ic className="w-4 h-4 text-[var(--muted)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--muted)] leading-tight">{label}</p>
                    <p className="text-sm font-semibold truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* bairros + autorização de imagem */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-2xl p-5 lg:col-span-2 flex flex-col">
          <h3 className="font-heading font-semibold text-lg mb-1">De onde vêm os alunos</h3>
          <p className="text-xs text-[var(--muted)] mb-5">Bairros com mais matrículas · Goiânia</p>
          <div className="flex-1 grid sm:grid-cols-2 gap-x-10 gap-y-4 content-center">
            {hoods.map(([n, v], i) => (
              <div key={n}>
                <div className="flex justify-between gap-3 text-sm mb-1.5">
                  <span className="font-medium truncate">{n}</span>
                  <span className="text-[var(--muted)] whitespace-nowrap shrink-0">{v} aluno{v === 1 ? '' : 's'}</span>
                </div>
                <BlockBar pct={(v / hoodMax) * 100} color={i === 0 ? '#F5B700' : '#2F539A'} />
              </div>
            ))}
          </div>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col">
          <h3 className="font-heading font-semibold text-lg mb-1">Autorização de imagem</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Quem permite fotos nas redes da escola</p>
          <ChartShell className="h-44">
            <DonutChart labels={pay.map((x) => x[0])} data={pay.map((x) => x[1])} colors={pay.map((x) => x[2])} cutout="66%" />
          </ChartShell>
          <div className="mt-auto pt-4 space-y-2">
            {pay.map((x) => (
              <div key={x[0]} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: x[2] }} />
                  {x[0]}
                </span>
                <span className="font-semibold text-[13px]">{x[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
