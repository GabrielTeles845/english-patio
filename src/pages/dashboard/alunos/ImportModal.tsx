import { useState, type DragEvent } from 'react';
import { AlertCircle, AlertTriangle, CalendarOff, FileUp, Info, SearchCheck, ShieldCheck, Sparkle, Trash2, UserRoundPlus } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { bump, logAct } from '../../../lib/dashboard/store';
import { esc, IMPORT_SAMPLE, STUDENTS, type Student } from '../../../lib/dashboard/data';
import { analyzeImport, type ImportAnalysis } from './importCsv';

/* Importar planilha (CSV/XLSX) com deduplicação de verdade — port de
   openImportModal/importReadFile/runImport/impToggle/applyImport e do reset
   confirmWipeData/wipeAllData (dashboard.html l.4779–5010). XLSX entra pelo
   pacote `xlsx` (no preview era o CDN) e reusa todo o pipeline de CSV. */

const ckSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type Phase = { k: 'pick' } | { k: 'wipe' } | { k: 'result'; data: ImportAnalysis };

export function ImportModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const who = effectiveUser?.name ?? 'Equipe';
  const [phase, setPhase] = useState<Phase>({ k: 'pick' });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [, setTick] = useState(0); // re-render dos toggles da lista de conferência

  const runImport = (text: string, sourceName: string) => {
    const res = analyzeImport(text, sourceName);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError('');
    setPhase({ k: 'result', data: res.data });
  };

  const readFile = (f: File) => {
    const isCsv = /\.csv$/i.test(f.name), isXlsx = /\.xlsx?$/i.test(f.name);
    if (!isCsv && !isXlsx) {
      setError(`<b>${esc(f.name)}</b> não é .csv nem .xlsx. Use a planilha de matrículas (CSV ou Excel).`);
      return;
    }
    if (f.size > 16 * 1024 * 1024) {
      setError('Arquivo muito grande (limite de 16 MB). Confira se é mesmo a planilha de matrículas.');
      return;
    }
    const r = new FileReader();
    r.onerror = () => setError('Não foi possível ler o arquivo. Tente de novo.');
    if (isXlsx) {
      r.onload = async () => {
        try {
          const XLSX = await import('xlsx');
          const wb = XLSX.read(new Uint8Array(r.result as ArrayBuffer), { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          runImport(XLSX.utils.sheet_to_csv(ws), f.name); /* reusa todo o pipeline de CSV (dedup + validação) */
        } catch {
          setError('Não foi possível ler este Excel. Salve como .xlsx novo ou exporte em CSV.');
        }
      };
      r.readAsArrayBuffer(f);
    } else {
      r.onload = () => runImport(String(r.result || ''), f.name);
      r.readAsText(f, 'utf-8');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readFile(f);
  };

  const applyImport = (data: ImportAnalysis) => {
    const add: Student[] = data.pending.filter((p) => !p._skip).map(({ _warn, _skip, ...s }) => {
      void _warn; void _skip;
      return s;
    });
    if (!add.length) return;
    STUDENTS.push(...add);
    const dv = (s: Student) => s.date.split('/').reverse().join('') + (s.hora || '');
    STUDENTS.sort((a, b) => (dv(a) < dv(b) ? 1 : dv(a) > dv(b) ? -1 : 0));
    bump();
    const skipped = data.pending.length - add.length;
    onClose();
    logAct(who, `Importou a planilha de matrículas — ${add.length} nova${add.length > 1 ? 's' : ''}${skipped ? `, ${skipped} deixada${skipped > 1 ? 's' : ''} de fora` : ''}`);
    toast(`${add.length} matrícula${add.length > 1 ? 's importadas' : ' importada'} da planilha!${skipped ? ` ${skipped > 1 ? skipped + ' ficaram' : '1 ficou'} de fora, como você pediu.` : ''}`);
  };

  const wipeAll = () => {
    const n = STUDENTS.length;
    STUDENTS.length = 0;
    bump();
    onClose();
    logAct(who, `Excluiu todos os dados — ${n} matrícula${n === 1 ? '' : 's'} removida${n === 1 ? '' : 's'}`);
    toast(`${n} matrícula${n === 1 ? '' : 's'} excluída${n === 1 ? '' : 's'} — base zerada.`);
  };

  /* --- confirmação do reset (port confirmWipeData l.4779) --- */
  if (phase.k === 'wipe') {
    const n = STUDENTS.length;
    return (
      <Modal title="Excluir todos os dados?" onClose={onClose}>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
            <div className="w-10 h-10 rounded-xl grid place-content-center shrink-0" style={{ background: 'rgba(220,38,38,.12)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Apagar {n} matrícula{n === 1 ? '' : 's'}?</p>
              <p className="text-xs text-[var(--muted)]">Remove todos os alunos e responsáveis. Turmas e salas continuam. No preview não dá para desfazer.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition">
              Cancelar
            </button>
            <button onClick={wipeAll} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: '#DC2626' }}>
              <Trash2 className="w-4 h-4" /> Excluir tudo
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* --- resultado: números + lista de conferência (desmarcar = não importar) --- */
  if (phase.k === 'result') {
    const data = phase.data;
    const flagged = data.pending.map((p, i) => ({ p, i })).filter((x) => x.p._warn.length);
    const clean = data.pending.filter((p) => !p._warn.length);
    const nSel = data.pending.filter((x) => !x._skip).length;
    const stat = (n: number, label: string, c: string) => (
      <div className="rounded-xl p-3 text-center" style={{ background: 'var(--hover)' }}>
        <p className="font-heading text-2xl font-semibold" style={{ color: c }}>{n}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight">{label}</p>
      </div>
    );
    return (
      <Modal title="Importar planilha de matrículas" size="max-w-lg" onClose={onClose}>
        <div className="p-5 space-y-4">
          <p className="text-sm">
            <b>{data.sourceName}</b> lida — confira antes de confirmar:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stat(data.linhas, 'linhas lidas', 'var(--text)')}
            {stat(data.dups, 'repetidas removidas', '#B5860B')}
            {stat(data.jaExiste, 'já estavam aqui', '#2F539A')}
            {stat(data.pending.length, 'novas matrículas', '#16a34a')}
          </div>
          {data.incompletas > 0 && (
            <p className="text-xs text-[var(--muted)]">
              <Info className="w-3.5 h-3.5 inline" /> {data.incompletas} linha{data.incompletas > 1 ? 's' : ''} sem aluno ou responsável{' '}
              {data.incompletas > 1 ? 'foram ignoradas' : 'foi ignorada'}.
            </p>
          )}
          {flagged.length > 0 && (
            <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(245,183,0,.10)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: '#B5860B' }}>
                <SearchCheck className="w-4 h-4 shrink-0" />
                {flagged.length === 1 ? '1 matrícula' : flagged.length + ' matrículas'} para conferir — desmarque o que não deve entrar:
              </p>
              {flagged.map(({ p, i }) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    p._skip = !p._skip;
                    setTick((t) => t + 1);
                  }}
                  className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-[var(--hover)] transition"
                >
                  <span className={`ck ${p._skip ? '' : 'on'} mt-0.5 shrink-0`}>{ckSvg}</span>
                  <span className="min-w-0">
                    <span className="text-sm font-medium block">
                      {p.kids.map((k) => k.n).join(' e ')}{' '}
                      <span className="text-xs text-[var(--muted)] font-normal">· resp. {p.resp.n}</span>
                    </span>
                    {p._warn.map((w, j) => (
                      <span key={j} className="text-xs text-[var(--muted)] block mt-0.5">
                        • {w}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
          {clean.length > 0 && (
            <ul className="text-sm space-y-1.5 rounded-xl p-3" style={{ background: 'var(--hover)' }}>
              {clean.slice(0, 6).map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <UserRoundPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {p.kids.map((k) => k.n).join(' e ')}
                </li>
              ))}
              {clean.length > 6 && <li className="text-xs text-[var(--muted)]">… e mais {clean.length - 6}</li>}
            </ul>
          )}
          {data.pending.length ? (
            !data.hasSinceCol && (
              <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                <CalendarOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  A planilha não tem a coluna <b>“Na escola desde”</b> — as matrículas chegam com esse campo em branco. Preencha depois em
                  ⋮ → Editar dados.
                </span>
              </p>
            )
          ) : (
            <p className="text-sm text-[var(--muted)]">Nada novo para importar — todas as linhas já estão na dashboard ou eram repetidas.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setPhase({ k: 'pick' })}
              className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition"
            >
              Voltar
            </button>
            {data.pending.length > 0 && (
              <button
                onClick={() => applyImport(data)}
                disabled={!nSel}
                className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                {nSel ? `Importar ${nSel} matrícula${nSel > 1 ? 's' : ''}` : 'Nada selecionado'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  /* --- escolher arquivo --- */
  return (
    <Modal title="Importar planilha de matrículas" size="max-w-lg" onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Use a planilha de matrículas em <b>CSV</b> ou <b>Excel (.xlsx)</b> — com as colunas da planilha atual.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('importFile')?.click()}
          className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition hover:bg-[var(--hover)]"
          style={{ borderColor: dragOver ? '#2F539A' : 'var(--border)' }}
        >
          <FileUp className="w-8 h-8 mx-auto text-brand-light mb-2" />
          <p className="text-sm font-medium">
            Arraste o arquivo aqui ou <span className="text-brand-light">clique para escolher</span>
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">.csv ou .xlsx — a planilha de matrículas</p>
          <input
            id="importFile"
            type="file"
            accept=".csv,.xlsx,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (f) readFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: 'rgba(245,183,0,.10)', color: '#B5860B' }}>
          <p className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" /> O que é conferido sozinho antes de entrar:
          </p>
          <p>• <b>Linhas repetidas</b> (a mesma matrícula enviada duas vezes) são removidas — só a primeira conta.</p>
          <p>• <b>Quem já está na dashboard</b> não duplica.</p>
          <p>
            • <b>Nomes iguais</b>, versões diferentes da mesma matrícula e <b>dados estranhos</b> (CPF — formato e dígitos —, telefone,
            datas, e-mail, endereço fora de GO) entram numa lista para você conferir antes de confirmar.
          </p>
          <p>• O campo <b>“Na escola desde”</b> não existe na planilha — as matrículas importadas chegam com ele em branco, para preencher depois.</p>
          <p>• Alunos importados chegam <b>sem turma</b> (a planilha não diz dia nem horário) — eles entram na fila "aguardando turma" para alocar pela Agenda.</p>
        </div>
        {error && (
          <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(220,38,38,.08)', color: '#DC2626' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: error }} />
          </div>
        )}
        <button
          onClick={() => runImport(IMPORT_SAMPLE, 'planilha de exemplo')}
          className="w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition flex items-center justify-center gap-2"
        >
          <Sparkle className="w-4 h-4 text-brand-light" /> Testar com uma planilha de exemplo
        </button>
        <div className="pt-3 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setPhase({ k: 'wipe' })}
            className="w-full h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition"
            style={{ borderColor: 'rgba(220,38,38,.4)', color: '#DC2626' }}
          >
            <Trash2 className="w-4 h-4" /> Excluir todas as matrículas ({STUDENTS.length})
          </button>
          <p className="text-[11px] text-[var(--muted)] text-center mt-1.5">
            Zera os dados para testar a importação do zero. Turmas e salas não são afetadas.
          </p>
        </div>
      </div>
    </Modal>
  );
}
