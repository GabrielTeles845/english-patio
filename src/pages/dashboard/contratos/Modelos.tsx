import { useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  Lightbulb,
  ListChecks,
  LocateFixed,
  Move,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../../lib/dashboard/auth';
import { bump, logAct, useDash } from '../../../lib/dashboard/store';
import { esc, TEMPLATES, TPL_FIELDS, TPL_PAGE_TEXT, tplById, unmappedCount, type Template } from '../../../lib/dashboard/data';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { EmptyState, EmptyButton } from '../../../components/dashboard/ui/EmptyState';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { inputCls } from '../../../components/dashboard/ui/inputs';
import { NtBox } from '../alunos/common';

/* Sub-tela MODELOS DE CONTRATO — port 1:1 da seção data-view="modelos" do
   dashboard.html (markup l.780–783, JS l.5031–5298: renderModelos, openTplImport,
   setActiveTpl, openTplRename, deleteTpl, tplMapHTML, chipDown/Move/Up).
   SÓ Diretor (gate de rota no DashboardLayout, espelho do go() l.1628);
   "arquivar" é implícito como no preview: definir outro modelo como "em uso"
   arquiva o atual (badge Arquivado). */

type TplModal =
  | null
  | { kind: 'import' }
  | { kind: 'rename'; id: number }
  | { kind: 'delete'; id: number }
  | { kind: 'delete-active'; id: number }
  | { kind: 'activate'; id: number }
  | { kind: 'unmapped'; id: number };

export default function Modelos() {
  useDash();
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const who = effectiveUser?.name ?? 'Equipe';

  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [tplOpen, setTplOpen] = useState<number | null>(null);
  const [tplPage, setTplPage] = useState(1);
  const [tplFocus, setTplFocus] = useState<string | null>(null);
  const [modal, setModal] = useState<TplModal>(null);

  const openTplMap = (id: number) => {
    setTplOpen(id);
    setTplPage(1);
    setTplFocus(null);
    setMode('map');
  };

  /* --- ativar com validações (port setActiveTpl l.5130) --- */
  const setActiveTpl = (id: number) => {
    const t = tplById(id);
    if (!t || t.active) return;
    setModal(unmappedCount(t) ? { kind: 'unmapped', id } : { kind: 'activate', id });
  };
  const confirmActiveTpl = (id: number) => {
    TEMPLATES.forEach((t) => {
      t.active = t.id === id;
    });
    bump();
    setModal(null);
    logAct(who, `Definiu <b>"${esc(tplById(id)?.name || '')}"</b> como modelo de contrato em uso`);
    toast('Modelo em uso atualizado — vale para as próximas matrículas!');
  };

  /* --- excluir com validações (port deleteTpl l.5180) --- */
  const deleteTpl = (id: number) => {
    const t = tplById(id);
    if (!t) return;
    setModal(t.active ? { kind: 'delete-active', id } : { kind: 'delete', id });
  };
  const confirmDeleteTpl = (id: number) => {
    const i = TEMPLATES.findIndex((t) => t.id === id);
    if (i < 0) return;
    const nome = TEMPLATES[i].name;
    TEMPLATES.splice(i, 1);
    bump();
    setModal(null);
    toast(`Modelo "${nome}" excluído.`);
  };

  if (mode === 'map' && tplOpen !== null) {
    const t = tplById(tplOpen);
    if (t)
      return (
        <section className="fade-in">
          <BackButton onClick={() => navigate('/dashboard/contratos')} />
          <TplMap
            t={t}
            tplPage={tplPage}
            tplFocus={tplFocus}
            setTplPage={setTplPage}
            setTplFocus={setTplFocus}
            onBack={() => setMode('list')}
          />
        </section>
      );
  }

  return (
    <section className="fade-in">
      <BackButton onClick={() => navigate('/dashboard/contratos')} />

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold mb-1">Modelos de contrato</h1>
          <p className="text-[var(--muted)] text-sm">
            O PDF que cada matrícula preenche. Edite no Google Docs, baixe como PDF e importe aqui — depois confira onde cada campo é
            carimbado.
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: 'import' })}
          data-tour="tpl-import"
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
        >
          <FileUp className="w-4 h-4" />
          Importar PDF
        </button>
      </div>

      <div className="space-y-3">
        {!TEMPLATES.length ? (
          <EmptyState
            icon={FileText}
            title="Nenhum modelo importado"
            sub="Importe o PDF do contrato para começar — depois você posiciona onde cada campo é carimbado."
            action={<EmptyButton icon={FileUp} label="Importar PDF" onClick={() => setModal({ kind: 'import' })} />}
          />
        ) : (
          TEMPLATES.map((t) => {
            const um = unmappedCount(t);
            return (
              <div key={t.id} className="surface rounded-2xl p-5" data-tour={t.active ? 'tpl-atual' : 'tpl-card'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl grid place-content-center shrink-0"
                      style={{ background: t.active ? 'rgba(22,163,74,.10)' : 'var(--hover)' }}
                    >
                      <FileText className={`w-5 h-5 ${t.active ? '' : 'text-brand-light'}`} style={t.active ? { color: '#16a34a' } : undefined} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {t.file} · {t.size} · {t.pages} páginas · enviado por {t.by} em {t.date}
                      </p>
                      {um > 0 && (
                        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: '#B5860B' }}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {um} campo{um > 1 ? 's' : ''} sem posição no PDF — ajuste no mapeamento
                        </p>
                      )}
                    </div>
                  </div>
                  {t.active ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#16a34a', background: 'rgba(22,163,74,.12)' }}>
                      Em uso
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: 'var(--muted)', background: 'var(--hover)' }}>
                      Arquivado
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => openTplMap(t.id)}
                    className="h-9 px-3.5 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition flex items-center gap-1.5"
                  >
                    <LocateFixed className="w-4 h-4 text-brand-light" /> Ver mapeamento
                  </button>
                  {!t.active && (
                    <button
                      onClick={() => setActiveTpl(t.id)}
                      data-tip={um ? `Posicione os ${um} campos pendentes antes de usar este modelo` : undefined}
                      className={`h-9 px-3.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${um ? 'opacity-50 cursor-not-allowed border border-[var(--border)]' : 'text-white'}`}
                      style={um ? undefined : { background: '#1E3765' }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Usar nas matrículas
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ kind: 'rename', id: t.id })}
                    data-tip="Renomear modelo"
                    className="h-9 w-9 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast('Download do PDF iniciado (demo)')}
                    data-tip="Baixar o PDF"
                    className="h-9 w-9 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTpl(t.id)}
                    data-tip="Excluir modelo"
                    className="h-9 w-9 rounded-lg border border-[var(--border)] grid place-content-center hover:bg-[var(--hover)] transition"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#DC2626' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modal?.kind === 'import' && (
        <ImportTplModal
          onClose={() => setModal(null)}
          onImported={(id) => {
            setModal(null);
            toast('Modelo importado! 6 de 8 campos reconhecidos — posicione os 2 pendentes.');
            openTplMap(id);
          }}
        />
      )}
      {modal?.kind === 'rename' && <RenameTplModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'unmapped' && (() => {
        const t = tplById(modal.id);
        if (!t) return null;
        const um = unmappedCount(t);
        return (
          <Modal
            title="Campos pendentes"
            onClose={() => setModal(null)}
            footer={
              <>
                <button onClick={() => setModal(null)} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold">
                  Agora não
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    openTplMap(modal.id);
                  }}
                  className="flex-1 h-11 rounded-xl text-white text-sm font-semibold"
                  style={{ background: '#1E3765' }}
                >
                  Abrir mapeamento
                </button>
              </>
            }
          >
            <div className="p-5">
              <p className="text-sm">
                O modelo <b>{t.name}</b> ainda tem{' '}
                <b style={{ color: '#B5860B' }}>
                  {um} campo{um > 1 ? 's' : ''} sem posição
                </b>{' '}
                no PDF. Se ele fosse usado assim, {um > 1 ? 'esses dados não apareceriam' : 'esse dado não apareceria'} nos contratos.
              </p>
            </div>
          </Modal>
        );
      })()}
      {modal?.kind === 'activate' && (() => {
        const t = tplById(modal.id);
        if (!t) return null;
        return (
          <Modal
            title="Usar este modelo"
            onClose={() => setModal(null)}
            footer={
              <>
                <button onClick={() => setModal(null)} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold">
                  Cancelar
                </button>
                <button
                  onClick={() => confirmActiveTpl(modal.id)}
                  className="flex-1 h-11 rounded-xl text-white text-sm font-semibold"
                  style={{ background: '#1E3765' }}
                >
                  Confirmar troca
                </button>
              </>
            }
          >
            <div className="p-5">
              <p className="text-sm">
                As <b>próximas matrículas</b> passam a preencher o <b>{t.name}</b>. O modelo atual fica arquivado (os contratos já gerados
                não mudam).
              </p>
            </div>
          </Modal>
        );
      })()}
      {modal?.kind === 'delete-active' && (() => {
        const t = tplById(modal.id);
        if (!t) return null;
        return (
          <Modal
            title="Modelo em uso"
            onClose={() => setModal(null)}
            footer={
              <button onClick={() => setModal(null)} className="w-full h-11 rounded-xl border border-[var(--border)] text-sm font-semibold">
                Entendi
              </button>
            }
          >
            <div className="p-5">
              <p className="text-sm">
                <b>{t.name}</b> é o modelo das matrículas atuais — não dá para excluir. Defina outro como "em uso" primeiro.
              </p>
            </div>
          </Modal>
        );
      })()}
      {modal?.kind === 'delete' && (() => {
        const t = tplById(modal.id);
        if (!t) return null;
        return (
          <Modal
            title="Excluir modelo"
            onClose={() => setModal(null)}
            footer={
              <>
                <button onClick={() => setModal(null)} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold">
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDeleteTpl(modal.id)}
                  className="flex-1 h-11 rounded-xl text-white text-sm font-semibold"
                  style={{ background: '#DC2626' }}
                >
                  Excluir modelo
                </button>
              </>
            }
          >
            <div className="p-5">
              <p className="text-sm">
                Excluir <b>{t.name}</b>? Os contratos já gerados com ele continuam guardados — só o arquivo do modelo some daqui.
              </p>
            </div>
          </Modal>
        );
      })()}
    </section>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] mb-4">
      <ArrowLeft className="w-4 h-4" /> Voltar para contratos
    </button>
  );
}

/* --- importar novo modelo (PDF) com validações (port openTplImport l.5070) --- */
function ImportTplModal({ onClose, onImported }: { onClose: () => void; onImported: (id: number) => void }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* port tplTake (l.5100): só .pdf, até 10 MB */
  const take = (f: File | null | undefined) => {
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) {
      setFile(null);
      setErr(`<b>${esc(f.name)}</b> não é um PDF. No Google Docs use "Arquivo → Fazer download → PDF".`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFile(null);
      setErr('PDF muito grande (limite de 10 MB). Tente exportar de novo sem imagens pesadas.');
      return;
    }
    setFile(f);
    setErr('');
  };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    take(e.target.files?.[0]);
    e.target.value = '';
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.borderColor = 'var(--border)';
    take(e.dataTransfer.files?.[0]);
  };

  /* port confirmTplImport (l.5116): nome único; campos "alunos" e "data" ficam pendentes */
  const confirm = () => {
    if (!name.trim() || !file) return;
    const n = name.trim();
    if (TEMPLATES.some((t) => t.name.toLowerCase() === n.toLowerCase())) {
      setErr(`Já existe um modelo chamado <b>${esc(n)}</b> — use outro nome.`);
      return;
    }
    const id = Math.max(...TEMPLATES.map((t) => t.id), 0) + 1;
    /* novo PDF: a maioria dos campos é reconhecida sozinha; o que mudar de lugar fica pendente */
    TEMPLATES.unshift({
      id,
      name: n,
      file: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      pages: 4,
      by: 'Priscylla Martins',
      date: '03/06/2026',
      active: false,
      fields: TPL_FIELDS.map((f) => ({ ...f, mapped: f.k !== 'alunos' && f.k !== 'data' })),
    });
    bump();
    onImported(id);
  };

  return (
    <Modal
      title="Importar modelo de contrato"
      size="max-w-lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!name.trim() || !file}
            className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Importar e mapear
          </button>
        </>
      }
    >
      <div className="p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Nome do modelo</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Contrato 2027.1" className={inputCls} />
        </label>
        <div
          ref={dropRef}
          onDragOver={(e) => {
            e.preventDefault();
            if (dropRef.current) dropRef.current.style.borderColor = '#2F539A';
          }}
          onDragLeave={() => {
            if (dropRef.current) dropRef.current.style.borderColor = 'var(--border)';
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition hover:bg-[var(--hover)]"
          style={{ borderColor: 'var(--border)' }}
        >
          {file ? (
            <p className="text-sm font-medium">
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                {file.name} <span className="text-xs text-[var(--muted)]">({(file.size / 1024).toFixed(0)} KB)</span>
              </span>
            </p>
          ) : (
            <>
              <FileUp className="w-7 h-7 mx-auto text-brand-light mb-2" />
              <p className="text-sm font-medium">
                Arraste o PDF aqui ou <span className="text-brand-light">clique para escolher</span>
              </p>
            </>
          )}
          <p className="text-xs text-[var(--muted)] mt-1">Somente .pdf · até 10 MB</p>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPick} />
        </div>
        <NtBox msg={err} kind="err" />
        <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'rgba(47,83,154,.08)', color: '#2F539A' }}>
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Edita o contrato no <b>Google Docs</b>? Use "Arquivo → Fazer download → PDF" e importe aqui. Depois é só conferir o mapeamento
            dos campos.
          </span>
        </div>
      </div>
    </Modal>
  );
}

/* --- renomear (port openTplRename/saveTplRename l.5156) --- */
function RenameTplModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { toast } = useToast();
  const t = tplById(id);
  const [name, setName] = useState(t?.name ?? '');
  const [err, setErr] = useState('');
  if (!t) return null;

  const save = () => {
    const n = name.trim();
    if (!n) return setErr('O modelo precisa de um nome.');
    if (TEMPLATES.some((x) => x.id !== id && x.name.toLowerCase() === n.toLowerCase()))
      return setErr(`Já existe um modelo chamado <b>${esc(n)}</b>.`);
    t.name = n;
    bump();
    onClose();
    toast('Modelo renomeado!');
  };

  return (
    <Modal
      title="Renomear modelo"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={save}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Salvar nome
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nome do modelo</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <NtBox msg={err} kind="err" />
      </div>
    </Modal>
  );
}

/* --- mapeamento: onde cada campo da matrícula cai no PDF (port tplMapHTML l.5222
   + drag chipDown/chipMove/chipUp l.5270) — arraste os marcadores --- */
function TplMap({
  t,
  tplPage,
  tplFocus,
  setTplPage,
  setTplFocus,
  onBack,
}: {
  t: Template;
  tplPage: number;
  tplFocus: string | null;
  setTplPage: (p: number) => void;
  setTplFocus: (k: string | null) => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ fk: string; chip: HTMLElement; moved: boolean; x: number; y: number } | null>(null);
  const um = unmappedCount(t);

  const chipDown = (e: ReactPointerEvent, fk: string) => {
    e.preventDefault();
    const chip = document.getElementById('chip-' + fk);
    const box = boxRef.current;
    if (!chip || !box) return;
    dragRef.current = { fk, chip, moved: false, x: 0, y: 0 };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      const x = Math.min(97, Math.max(3, ((ev.clientX - r.left) / r.width) * 100));
      const y = Math.min(97, Math.max(3, ((ev.clientY - r.top) / r.height) * 100));
      d.chip.style.left = x + '%';
      d.chip.style.top = y + '%';
      d.x = x;
      d.y = y;
      d.moved = true;
    };
    const up = () => {
      const d = dragRef.current;
      if (d && d.moved) {
        const f = t.fields.find((x) => x.k === d.fk);
        if (f) {
          f.x = d.x;
          f.y = d.y;
        }
        setTplFocus(d.fk);
        bump();
        toast('Posição do campo atualizada!');
      }
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      dragRef.current = null;
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  /* port tplPlaceField (l.5263) */
  const placeField = (k: string) => {
    const f = t.fields.find((x) => x.k === k);
    if (!f) return;
    f.mapped = true;
    f.x = 50;
    f.y = 50;
    setTplPage(f.page);
    setTplFocus(k);
    bump();
    toast(`"${f.label}" posicionado no centro da página ${f.page} — arraste para o lugar certo.`);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold mb-1 flex items-center gap-2">
            <LocateFixed className="w-6 h-6 text-brand-light" />
            {t.name}
          </h1>
          <p className="text-[var(--muted)] text-sm">
            Cada marcador amarelo é um dado da matrícula carimbado no PDF. <b>Arraste</b> para ajustar a posição.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)]"
        >
          <ArrowLeft className="w-4 h-4" /> Todos os modelos
        </button>
      </div>
      {um > 0 && (
        <div className="rounded-xl p-3 mb-4 text-sm flex items-center gap-2" style={{ background: 'rgba(245,183,0,.12)', color: '#B5860B' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <b>
              {um} campo{um > 1 ? 's' : ''} sem posição
            </b>{' '}
            — use "Posicionar" na lista ao lado e arraste para o lugar certo.
          </span>
        </div>
      )}
      <div className="grid lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 surface rounded-2xl p-4">
          <div className="flex items-center gap-1.5 bg-[var(--hover)] rounded-xl p-1 w-max mb-3">
            {[1, 2, 4].map((p) => {
              const n = t.fields.filter((f) => f.page === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setTplPage(p)}
                  className={`px-3.5 h-9 rounded-lg text-sm font-medium transition ${tplPage === p ? 'text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}
                  style={tplPage === p ? { background: '#1E3765' } : undefined}
                >
                  Página {p} <span className="text-[10px] opacity-70">({n})</span>
                </button>
              );
            })}
          </div>
          <div
            ref={boxRef}
            id="tplPageBox"
            className="relative bg-white text-slate-700 rounded-lg shadow-md p-6 text-[10px] leading-relaxed select-none"
            style={{ aspectRatio: '210/260', overflow: 'hidden' }}
          >
            <div dangerouslySetInnerHTML={{ __html: TPL_PAGE_TEXT[tplPage] || '' }} />
            {t.fields
              .filter((f) => f.page === tplPage && f.mapped)
              .map((f) => (
                <button
                  key={f.k}
                  id={'chip-' + f.k}
                  onPointerDown={(e) => chipDown(e, f.k)}
                  onClick={() => setTplFocus(f.k)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-[10px] font-bold shadow-md cursor-grab select-none whitespace-nowrap transition-shadow"
                  style={{
                    left: f.x + '%',
                    top: f.y + '%',
                    background: tplFocus === f.k ? '#1E3765' : '#FFE17A',
                    color: tplFocus === f.k ? '#FFE17A' : '#15294d',
                    border: `1.5px solid ${tplFocus === f.k ? '#F5B700' : '#B5860B'}`,
                    touchAction: 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-2 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5" /> Posições em % da página — no produto final viram as coordenadas do PDF (pdf-lib).
          </p>
        </div>
        <div className="lg:col-span-2 surface rounded-2xl p-4">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <ListChecks className="w-[18px] h-[18px] text-brand-light" />
            Campos da matrícula
          </h3>
          <div className="space-y-2">
            {t.fields.map((f) => (
              <div
                key={f.k}
                onClick={() => {
                  setTplFocus(f.k);
                  setTplPage(f.page);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${tplFocus === f.k ? 'ring-2 ring-brand-light' : ''} hover:bg-[var(--hover)]`}
                style={{ background: tplFocus === f.k ? 'rgba(47,83,154,.06)' : 'var(--hover)' }}
              >
                {f.mapped ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#B5860B' }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {f.src} · pág. {f.page}
                  </p>
                </div>
                {f.mapped ? (
                  <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">
                    x {Math.round(f.x)}% · y {Math.round(f.y)}%
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      placeField(f.k);
                    }}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
                    style={{ background: '#B5860B' }}
                  >
                    Posicionar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
