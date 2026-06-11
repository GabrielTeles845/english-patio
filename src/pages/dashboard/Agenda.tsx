import { useState, type ReactNode } from 'react';
import {
  Armchair,
  CalendarPlus,
  DoorOpen,
  ImageDown,
  LayoutGrid,
  Layers,
  Plus,
  Sun,
  Table2,
} from 'lucide-react';
import {
  SALAS,
  STUDENTS,
  TURMAS,
  type Par,
  type Turma,
  esc,
  horaPeriodo,
  kidTurma,
  nivelByK,
  nivelLabel,
  salaById,
  schLabel,
  semTurmaKids,
  slugify,
  turmaAt,
  turmaById,
  turmaFull,
  turmaShort,
} from '../../lib/dashboard/data';
import { allocateKid, logAct, updateTurma } from '../../lib/dashboard/store';
import { useDashboardData } from '../../lib/dashboard/dataApi';
import { useAuth } from '../../lib/dashboard/auth';
import { useToast } from '../../components/dashboard/ui/Toast';
import { CSelect } from '../../components/dashboard/ui/CSelect';
import { EmptyState, EmptyButton } from '../../components/dashboard/ui/EmptyState';
import { QmHelp } from '../../components/dashboard/ui/icons';
import { GridView } from '../../components/dashboard/agenda/GridView';
import { SalasCards, SalaPageWrap } from '../../components/dashboard/agenda/RoomPage';
import { LevelView } from '../../components/dashboard/agenda/LevelView';
import { MuralView } from '../../components/dashboard/agenda/MuralView';
import { SalaPage, NivelPage } from '../../components/dashboard/agenda/CanvaPages';
import { MoveModal, AskFullModal } from '../../components/dashboard/agenda/MoveModal';
import { NewTurmaModal, TurmaModal, DeleteTurmaModal } from '../../components/dashboard/agenda/TurmaModals';
import {
  SalasTeachersModal,
  SalaEditModal,
  RemoveSalaModal,
  RemoveTeacherModal,
  type SmTab,
} from '../../components/dashboard/agenda/SalasTeachersModal';
import { ExportModal } from '../../components/dashboard/agenda/ExportModal';
import { exportPng } from '../../components/dashboard/agenda/exportPng';
import { getAgDrag, agDragEnd, agDragKid } from '../../components/dashboard/agenda/dnd';

/* ====================== AGENDA (salas × turmas × níveis) ======================
   Port 1:1 da tela do preview (dashboard.html, seção AGENDA l.687–724 e JS
   l.2568–3424). A tese: a agenda não se "edita" — edita-se o dado (aluno ↔
   turma) e todas as visões se redesenham. Substitui o quadro feito no Canva. */

type AgView = 'grade' | 'salas' | 'niveis' | 'mural';

type AgModal =
  | { kind: 'newTurma'; sala?: string | null; par?: Par | null; hora?: string | null; nivel?: string | null }
  | { kind: 'turma'; tid: number }
  | { kind: 'deleteTurma'; tid: number }
  | { kind: 'mover'; sid: number; ki: number; presel?: number; initialQuery?: string }
  | { kind: 'askFull'; sid: number; ki: number; tid: number }
  | { kind: 'salas'; tab: SmTab }
  | { kind: 'salaEdit'; id: string }
  | { kind: 'removeSala'; id: string }
  | { kind: 'removeTeacher'; name: string }
  | { kind: 'export' }
  | null;

/* deep-links da Visão geral — equivalente ao go('agenda');setAgView(...)/
   openSalaView(id)/openSalasManage('profs') do preview: a tela consome o
   preset uma única vez ao montar */
let agPreset: { view?: AgView; sala?: string; salasTab?: SmTab } | null = null;
export function presetAgenda(p: { view?: AgView; sala?: string; salasTab?: SmTab }) {
  agPreset = p;
}

export default function Agenda() {
  const { ready } = useDashboardData();
  const { effectiveUser } = useAuth();
  const { toast, toastErr } = useToast();
  const who = effectiveUser?.name ?? 'Painel';

  const [view, setViewRaw] = useState<AgView>(() => agPreset?.view ?? 'grade');
  const [par, setPar] = useState<Par>('seg-qua');
  const [vagasOnly, setVagasOnly] = useState(false);
  const [agSala, setAgSala] = useState<string | null>(() => agPreset?.sala ?? null);
  const [fPeriodo, setFPeriodo] = useState('');
  const [fProf, setFProf] = useState('');
  const [modal, setModal] = useState<AgModal>(() => (agPreset?.salasTab ? { kind: 'salas', tab: agPreset.salasTab } : null));
  agPreset = null; // consumido — próxima visita à Agenda volta ao padrão

  if (!ready) {
    return (
      <div className="grid place-content-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-brand-light animate-spin" />
      </div>
    );
  }

  /* clicar na pill sempre volta ao nível de cima (setAgView, l.2572) */
  const setView = (v: AgView) => {
    setViewRaw(v);
    setAgSala(null);
  };
  const openSalaView = (id: string) => {
    setViewRaw('salas');
    setAgSala(id);
  };

  /* filtros transversais (agPass, l.2578) */
  const pass = (t: Turma): boolean => {
    if (vagasOnly && turmaFull(t)) return false;
    if (fPeriodo && horaPeriodo(t.hora) !== fPeriodo) return false;
    if (fProf) {
      const p = salaById(t.sala)?.prof ?? null;
      if (fProf === 'none' ? !!p : p !== fProf) return false;
    }
    return true;
  };

  /* ---- drag-and-drop: turma → slot vazio · aluno → turma com vaga ---- */
  const onDropEmpty = async (sala: string, dPar: Par, hora: string) => {
    const d = getAgDrag();
    agDragEnd();
    if (!d || d.type !== 'turma') return;
    const t = turmaById(d.tid);
    if (!t) return;
    if (t.sala === sala && t.par === dPar && t.hora === hora) return;
    if (turmaAt(sala, dPar, hora)) {
      toastErr('Esse horário já tem turma nessa sala.');
      return;
    }
    const from = `${salaById(t.sala)!.n} · ${schLabel(t.par)} ${t.hora}`;
    const res = await updateTurma(t.id, { sala, par: dPar, hora, nivel: t.nivel, cap: t.cap });
    if (!res.ok) {
      toastErr(res.error);
      return;
    }
    logAct(
      who,
      `Moveu a turma <b>${nivelLabel(t.nivel)}</b> de ${esc(from)} para <b>${esc(salaById(sala)!.n)} · ${schLabel(dPar)} ${hora}</b> (arrastando na grade)`,
    );
    toast('Turma movida!');
  };

  /* port de dropMoveKid (l.2637): cheia → vaga extra · nível diferente → confirmação */
  const dropMoveKid = async (sid: number, ki: number, tid: number) => {
    const s = STUDENTS.find((x) => x.id === sid);
    const k = s?.kids[ki];
    if (!s || !k) return;
    const cur = kidTurma(k);
    const t = turmaById(tid);
    if (!t) return;
    if (cur && cur.id === t.id) return;
    if (turmaFull(t)) {
      setModal({ kind: 'askFull', sid, ki, tid });
      return;
    }
    const nv = nivelByK(t.nivel)!;
    const needsConfirm = cur ? t.nivel !== cur.nivel : k.age < nv.ages[0] - 1 || k.age > nv.ages[1] + 1;
    if (needsConfirm) {
      setModal({ kind: 'mover', sid, ki, presel: t.id });
      return;
    }
    const res = await allocateKid(sid, ki, tid);
    if (!res.ok) {
      toastErr(res.error);
      return;
    }
    logAct(
      who,
      cur
        ? `Moveu <b>${esc(k.n)}</b> de ${turmaShort(cur)} para <b>${turmaShort(t)}</b> (${nivelLabel(t.nivel)}) arrastando na agenda`
        : `Alocou <b>${esc(k.n)}</b> na turma <b>${turmaShort(t)}</b> (${nivelLabel(t.nivel)}) arrastando na agenda`,
    );
    toast(`${k.n.split(' ')[0]} agora está em ${turmaShort(t)}!`);
  };

  const onDropKidToTurma = (tid: number) => {
    const d = getAgDrag();
    agDragEnd();
    if (!d || d.type !== 'kid') return;
    dropMoveKid(d.sid, d.ki, tid);
  };

  /* soltar aluno num CARD de sala: abre o modal de alocação já filtrado por ela (l.2629) */
  const onDropKidSala = (salaId: string) => {
    const d = getAgDrag();
    agDragEnd();
    if (!d || d.type !== 'kid') return;
    const sala = salaById(salaId);
    if (!sala) return;
    setModal({ kind: 'mover', sid: d.sid, ki: d.ki, initialQuery: sala.n });
  };

  /* ---- exportação de imagens (as "páginas do Canva", sempre atualizadas) ---- */
  const doExportSala = async (salaId: string, ePar: Par) => {
    const sala = salaById(salaId);
    if (!sala) return;
    toast(`Gerando a imagem da ${sala.n}…`);
    if (await exportPng(<SalaPage salaId={salaId} par={ePar} forExport />, `agenda-${slugify(sala.n)}-${ePar}.png`)) {
      logAct(who, `Exportou a imagem da agenda da <b>${esc(sala.n)}</b> (${schLabel(ePar)})`);
      toast(`Imagem da ${sala.n} baixada!`);
    } else {
      toastErr('Não consegui gerar a imagem — confira a internet e tente de novo.');
    }
  };

  const doExportTodas = async () => {
    setModal(null);
    const list = SALAS.filter((s) => TURMAS.some((t) => t.sala === s.id && t.par === par));
    if (!list.length) {
      toastErr('Nenhuma sala com turmas neste par de dias.');
      return;
    }
    toast(`Gerando ${list.length} imagens (${schLabel(par)}) — os downloads chegam um a um…`);
    for (const s of list) {
      if (!(await exportPng(<SalaPage salaId={s.id} par={par} forExport />, `agenda-${slugify(s.n)}-${par}.png`))) {
        toastErr('Não consegui gerar a imagem — confira a internet e tente de novo.');
        return;
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    logAct(who, `Exportou o pacote de imagens da agenda (${list.length} salas · ${schLabel(par)})`);
    toast('Pacote da agenda exportado!');
  };

  const doExportNivel = async (k: string) => {
    setModal(null);
    const nv = nivelByK(k);
    if (!nv) return;
    toast(`Gerando a imagem do ${nv.n}…`);
    if (await exportPng(<NivelPage k={k} />, `agenda-nivel-${slugify(nv.n)}.png`)) {
      logAct(who, `Exportou a imagem do nível <b>${nv.n}</b> (todas as turmas)`);
      toast(`Imagem do ${nv.n} baixada!`);
    } else {
      toastErr('Não consegui gerar a imagem — confira a internet e tente de novo.');
    }
  };

  /* excluir sala: o aviso de "tem turmas" vem antes do modal (smRemoveSala, l.3245) */
  const askRemoveSala = (id: string) => {
    if (TURMAS.some((t) => t.sala === id)) {
      toastErr('Essa sala tem turmas — mova ou exclua as turmas antes.');
      return;
    }
    setModal({ kind: 'removeSala', id });
  };

  const fila = semTurmaKids();
  const AGPROFS = [...new Set(SALAS.map((s) => s.prof).filter((p): p is string => !!p))].sort();

  /* pills de visão (vpill, l.2657) */
  const vpill = (v: AgView, label: string, icon: ReactNode) => {
    const on = view === v;
    return (
      <button
        key={v}
        onClick={() => setView(v)}
        className={`flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-sm transition ${on ? 'text-white font-semibold shadow-md' : 'text-[var(--muted)] font-medium hover:text-[var(--text)]'}`}
        style={{ background: on ? 'linear-gradient(135deg,#1E3765,#2F539A)' : undefined }}
      >
        {icon}
        {label}
      </button>
    );
  };

  const body = !TURMAS.length ? (
    /* agenda completamente vazia (1º semestre) — port de agEmptyHTML (l.2687) */
    <div className="surface rounded-2xl">
      <EmptyState
        icon={CalendarPlus}
        title="Sua agenda ainda está vazia"
        sub={
          SALAS.length
            ? 'As salas já estão prontas — falta criar as turmas (sala · par de dias · horário · nível). Assim que a primeira existir, ela aparece aqui nas três visões e na exportação.'
            : 'Comece criando as salas e, em seguida, as turmas. Tudo o que você cadastrar aparece aqui nas três visões.'
        }
        action={
          SALAS.length ? (
            <EmptyButton
              icon={Plus}
              label="Criar primeira turma"
              onClick={() => setModal({ kind: 'newTurma', sala: SALAS[0].id, par, hora: '14:30' })}
            />
          ) : undefined
        }
      />
    </div>
  ) : view === 'grade' ? (
    <GridView
      par={par}
      pass={pass}
      onOpenSala={openSalaView}
      onOpenTurma={(tid) => setModal({ kind: 'turma', tid })}
      onNewTurma={(sala, nPar, hora) => setModal({ kind: 'newTurma', sala, par: nPar, hora })}
      onDropEmpty={onDropEmpty}
      onDropKid={onDropKidToTurma}
    />
  ) : view === 'salas' ? (
    agSala ? (
      <SalaPageWrap
        salaId={agSala}
        par={par}
        onBack={() => setAgSala(null)}
        onEditSala={(id) => setModal({ kind: 'salaEdit', id })}
        onExportSala={doExportSala}
        onMoveKid={(sid, ki) => setModal({ kind: 'mover', sid, ki })}
        onDropKid={onDropKidToTurma}
      />
    ) : (
      <SalasCards par={par} pass={pass} onOpenSala={openSalaView} onDropKidSala={onDropKidSala} />
    )
  ) : view === 'mural' ? (
    <MuralView
      par={par}
      onOpenSala={openSalaView}
      onMoveKid={(sid, ki) => setModal({ kind: 'mover', sid, ki })}
      onDropKid={onDropKidToTurma}
      onExportSala={doExportSala}
    />
  ) : (
    <LevelView
      pass={pass}
      onOpenTurma={(tid) => setModal({ kind: 'turma', tid })}
      onNewTurma={(nivel) => setModal({ kind: 'newTurma', nivel })}
      onDropKid={onDropKidToTurma}
    />
  );

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-1">Agenda</h1>
          <p className="text-[var(--muted)] text-sm">
            Todas as turmas, salas e níveis num lugar só — mover um aluno aqui atualiza a agenda inteira na hora
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModal({ kind: 'salas', tab: 'salas' })}
            className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
            data-tip="Cadastro das salas (nome e cor) e dos teachers (cada um com a sua sala — ou sem sala por enquanto)"
          >
            <DoorOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Salas & teachers</span>
          </button>
          <button
            onClick={() => setModal({ kind: 'export' })}
            data-tour="ag-export"
            className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
            data-tip="Gera as imagens da agenda — como as páginas do Canva, mas sempre atualizadas"
          >
            <ImageDown className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar imagens</span>
          </button>
          <button
            onClick={() => setModal({ kind: 'newTurma' })}
            data-tour="ag-nova"
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            <Plus className="w-4 h-4" />
            Nova turma
          </button>
        </div>
      </div>

      {/* fila: matriculou primeiro, atrela depois (renderAgFila, l.2673) */}
      {fila.length > 0 && TURMAS.length > 0 && (
        <div className="mb-4">
          <div className="surface rounded-2xl p-4" data-tour="ag-fila">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                Aguardando turma{' '}
                <span className="font-normal text-[var(--muted)]">
                  · {fila.length} aluno{fila.length > 1 ? 's' : ''}
                </span>{' '}
                <QmHelp tip="Aluno matriculado sem turma cai nesta fila — clique no nome para ver só os destinos válidos (turmas com vaga, do nível certo primeiro) ou arraste direto para uma turma" />
              </p>
              <p className="text-xs text-[var(--muted)]">clique no nome para alocar, ou arraste para uma turma</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fila.map(({ s, k, ki }) => (
                <button
                  key={`${s.id}-${ki}`}
                  onClick={() => setModal({ kind: 'mover', sid: s.id, ki })}
                  draggable
                  onDragStart={(e) => agDragKid(e, s.id, ki)}
                  onDragEnd={agDragEnd}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition hover:shadow-sm hover:border-brand-light"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  {k.n.split(' ').slice(0, 2).join(' ')} <span className="text-xs text-[var(--muted)]">({k.age})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* visões + filtros transversais */}
      <div className="surface rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2" data-tour="ag-filtros">
        <div className="flex items-center bg-[var(--hover)] rounded-xl p-1 text-sm" data-tour="ag-views">
          {vpill('grade', 'Grade', <Table2 className="w-4 h-4" />)}
          {vpill('salas', 'Salas', <DoorOpen className="w-4 h-4" />)}
          {vpill('niveis', 'Níveis', <Layers className="w-4 h-4" />)}
          {vpill('mural', 'Mural', <LayoutGrid className="w-4 h-4" />)}
        </div>
        <QmHelp tip="Grade = raio-X salas × horários · Salas = a página de cada sala · Níveis = onde tem vaga por nível · Mural = todas as páginas do par lado a lado" />
        <div className="h-6 w-px mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />
        {view !== 'niveis' && (
          <>
            <div className="flex items-center bg-[var(--hover)] rounded-xl p-1 text-sm" data-tour="ag-par">
              <button
                onClick={() => setPar('seg-qua')}
                className={`px-3 py-1.5 rounded-lg ${par === 'seg-qua' ? 'bg-[var(--card)] shadow-sm font-medium' : 'text-[var(--muted)]'}`}
              >
                Seg/Qua
              </button>
              <button
                onClick={() => setPar('ter-qui')}
                className={`px-3 py-1.5 rounded-lg ${par === 'ter-qui' ? 'bg-[var(--card)] shadow-sm font-medium' : 'text-[var(--muted)]'}`}
              >
                Ter/Qui
              </button>
            </div>
            <QmHelp tip="As turmas vivem em pares de dias: Seg/Qua ou Ter/Qui. Trocar aqui vale em todas as visões (a de Níveis mostra os dois pares juntos)" />
          </>
        )}
        <button
          onClick={() => setVagasOnly((v) => !v)}
          data-tour="ag-vagas"
          className="h-10 px-3 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition"
          style={{
            background: vagasOnly ? 'rgba(22,163,74,.10)' : undefined,
            color: vagasOnly ? '#16a34a' : undefined,
            borderColor: vagasOnly ? 'rgba(22,163,74,.45)' : 'var(--border)',
          }}
          data-tip="Mostra só as turmas que ainda têm vaga — o modo 'onde cabe aluno?'"
        >
          <Armchair className="w-4 h-4" />
          Só com vagas
        </button>
        <span>
          <CSelect
            value={fPeriodo}
            onChange={setFPeriodo}
            icon={<Sun className="w-4 h-4 text-[var(--muted)]" />}
            items={[
              { v: '', l: 'Manhã e tarde' },
              { v: 'm', l: 'Só manhã' },
              { v: 't', l: 'Só tarde' },
            ]}
          />
        </span>
        <span>
          <CSelect
            value={fProf}
            onChange={setFProf}
            items={[
              { v: '', l: 'Teacher: todos' },
              ...AGPROFS.map((p) => ({ v: p, l: p })),
              { v: 'none', l: 'Sem teacher', dot: '#B5860B' },
            ]}
          />
        </span>
      </div>

      <div>{body}</div>

      {/* ---- modais ---- */}
      {modal?.kind === 'newTurma' && (
        <NewTurmaModal
          sala={modal.sala}
          par={modal.par}
          hora={modal.hora}
          nivel={modal.nivel}
          defaultPar={par}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'turma' && (
        <TurmaModal
          key={modal.tid}
          tid={modal.tid}
          onClose={() => setModal(null)}
          onMoveKid={(sid, ki) => setModal({ kind: 'mover', sid, ki })}
          onOpenDelete={(tid) => setModal({ kind: 'deleteTurma', tid })}
        />
      )}
      {modal?.kind === 'deleteTurma' && <DeleteTurmaModal tid={modal.tid} onClose={() => setModal(null)} />}
      {modal?.kind === 'mover' && (
        <MoveModal
          key={`${modal.sid}-${modal.ki}-${modal.presel ?? ''}`}
          sid={modal.sid}
          ki={modal.ki}
          presel={modal.presel}
          initialQuery={modal.initialQuery}
          onClose={() => setModal(null)}
          onAskFull={(tid) => setModal({ kind: 'askFull', sid: modal.sid, ki: modal.ki, tid })}
        />
      )}
      {modal?.kind === 'askFull' && (
        <AskFullModal
          sid={modal.sid}
          ki={modal.ki}
          tid={modal.tid}
          onBack={() => setModal({ kind: 'mover', sid: modal.sid, ki: modal.ki })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'salas' && (
        <SalasTeachersModal
          tab={modal.tab}
          onTab={(tab) => setModal({ kind: 'salas', tab })}
          onClose={() => setModal(null)}
          onEditSala={(id) => setModal({ kind: 'salaEdit', id })}
          onRemoveSala={askRemoveSala}
          onRemoveTeacher={(name) => setModal({ kind: 'removeTeacher', name })}
        />
      )}
      {modal?.kind === 'salaEdit' && <SalaEditModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'removeSala' && (
        <RemoveSalaModal
          id={modal.id}
          onCancel={() => setModal({ kind: 'salas', tab: 'salas' })}
          onDone={() => setModal({ kind: 'salas', tab: 'salas' })}
        />
      )}
      {modal?.kind === 'removeTeacher' && (
        <RemoveTeacherModal
          name={modal.name}
          onCancel={() => setModal({ kind: 'salas', tab: 'profs' })}
          onDone={() => setModal({ kind: 'salas', tab: 'profs' })}
        />
      )}
      {modal?.kind === 'export' && (
        <ExportModal
          agSala={agSala}
          agPar={par}
          onClose={() => setModal(null)}
          onExportSala={doExportSala}
          onExportTodas={doExportTodas}
          onExportNivel={doExportNivel}
        />
      )}
    </section>
  );
}
