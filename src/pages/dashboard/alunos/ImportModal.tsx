import { useState, type DragEvent } from 'react';
import { AlertCircle, AlertTriangle, CalendarOff, FileUp, Info, Layers, SearchCheck, ShieldCheck, Sparkle, Trash2, UserRoundPlus } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { deleteAllEnrollments, importCommit, importDryRun } from '../../../lib/dashboard/store';
import { esc, IMPORT_SAMPLE, STUDENTS } from '../../../lib/dashboard/data';
import type { ImportDryRun } from '../../../lib/dashboard/importApi';

/* Importar planilha (CSV/XLSX) — agora LIGADA ao backend (DASHBOARD_API §4.7).
   O SERVIDOR é a fonte de verdade da análise: dry-run (POST /enrollments/import)
   valida + deduplica sem gravar; o commit (POST /enrollments/import/commit) grava
   só as famílias novas e válidas, idempotente por submission_id. A planilha é
   gerada pelo site (que valida tudo no envio), então dado inválido praticamente
   não aparece — mas se aparecer (planilha editada à mão), a linha cai em "precisa
   de conferência" e fica de fora, igual o site recusa dado inválido.
   XLSX é convertido para CSV no navegador e reusa o mesmo pipeline. */

type Phase = { k: 'pick' } | { k: 'wipe' } | { k: 'result'; report: ImportDryRun; csv: string; sourceName: string };

export function ImportModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>({ k: 'pick' });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  /* manda o CSV pro servidor analisar (dry-run) e mostra o relatório */
  const analyze = async (csv: string, sourceName: string) => {
    setError('');
    setLoading(true);
    const res = await importDryRun(csv);
    setLoading(false);
    if (!res.ok || !res.report) {
      setError(res.ok ? 'Não foi possível ler a planilha. Confira o arquivo.' : res.error);
      return;
    }
    setPhase({ k: 'result', report: res.report, csv, sourceName });
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
          analyze(XLSX.utils.sheet_to_csv(ws), f.name); /* reusa todo o pipeline de CSV (dedup + validação no servidor) */
        } catch {
          setError('Não foi possível ler este Excel. Salve como .xlsx novo ou exporte em CSV.');
        }
      };
      r.readAsArrayBuffer(f);
    } else {
      r.onload = () => analyze(String(r.result || ''), f.name);
      r.readAsText(f, 'utf-8');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readFile(f);
  };

  /* grava de verdade as famílias novas (o servidor reanalisa o mesmo CSV) */
  const confirmImport = async (csv: string) => {
    setLoading(true);
    const res = await importCommit(csv);
    setLoading(false);
    if (!res.ok || !res.result) {
      toast(res.ok ? 'Algo deu errado ao importar. Tente de novo.' : res.error);
      return;
    }
    const { imported, skipped } = res.result;
    onClose();
    if (!imported) {
      toast(skipped ? 'Nada novo — essas matrículas já estavam na dashboard.' : 'Nada para importar nesta planilha.');
      return;
    }
    toast(`${imported} matrícula${imported > 1 ? 's importadas' : ' importada'} da planilha!${skipped ? ` ${skipped > 1 ? skipped + ' já estavam' : '1 já estava'} aqui.` : ''}`);
  };

  const wipeAll = async () => {
    setLoading(true);
    const res = await deleteAllEnrollments();
    setLoading(false);
    onClose();
    if (!res.ok) return toast(res.error);
    const n = res.n ?? 0;
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
              <p className="text-xs text-[var(--muted)]">Remove todos os alunos e responsáveis do banco. Turmas e salas continuam. Não dá para desfazer.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={loading} className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={wipeAll} disabled={loading} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: '#DC2626' }}>
              <Trash2 className="w-4 h-4" /> {loading ? 'Excluindo…' : 'Excluir tudo'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* --- resultado: números do servidor + lista de conferência + conferência das pendentes --- */
  if (phase.k === 'result') {
    const { report, csv, sourceName } = phase;
    const linhas = report.toImportCount + report.alreadyInDb + report.needsReview.length + report.duplicatesRemoved;
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
            <b>{sourceName}</b> lida — confira antes de confirmar:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stat(linhas, 'linhas lidas', 'var(--text)')}
            {stat(report.duplicatesRemoved, 'repetidas removidas', '#B5860B')}
            {stat(report.alreadyInDb, 'já estavam aqui', '#2F539A')}
            {stat(report.toImportCount, 'novas matrículas', '#16a34a')}
          </div>

          {report.needsReview.length > 0 && (
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(245,183,0,.10)' }}>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#B5860B' }}>
                <SearchCheck className="w-4 h-4 shrink-0" />
                {report.needsReview.length === 1 ? '1 linha precisa' : report.needsReview.length + ' linhas precisam'} de correção na planilha — ficaram de fora:
              </p>
              {report.needsReview.slice(0, 6).map((nr) => (
                <p key={nr.submissionId} className="text-xs text-[var(--muted)]">
                  • Linha {nr.rowIndex + 1}: {nr.reasons.join('; ')}
                </p>
              ))}
              {report.needsReview.length > 6 && <p className="text-xs text-[var(--muted)]">… e mais {report.needsReview.length - 6}</p>}
            </div>
          )}

          {report.toImport.length > 0 && (
            <ul className="text-sm space-y-1.5 rounded-xl p-3" style={{ background: 'var(--hover)' }}>
              {report.toImport.slice(0, 6).map((t) => (
                <li key={t.submissionId} className="flex items-center gap-2">
                  <UserRoundPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {t.studentNames.join(' e ')}
                  <span className="text-xs text-[var(--muted)]">· resp. {t.responsible}</span>
                </li>
              ))}
              {report.toImport.length > 6 && <li className="text-xs text-[var(--muted)]">… e mais {report.toImport.length - 6}</li>}
            </ul>
          )}

          {report.toImportCount > 0 ? (
            <>
              <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                <Layers className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Alunos importados chegam <b>sem turma</b> (a planilha não traz dia nem horário) — entram na fila "aguardando turma" para alocar pela Agenda.</span>
              </p>
              <p className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                <CalendarOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>O campo <b>“Na escola desde”</b> não vem na planilha — chega em branco, para preencher depois em ⋮ → Editar dados.</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Nada novo para importar — todas as linhas já estão na dashboard, eram repetidas ou precisam de correção.</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setPhase({ k: 'pick' })}
              disabled={loading}
              className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-[var(--hover)] transition disabled:opacity-50"
            >
              Voltar
            </button>
            {report.toImportCount > 0 && (
              <button
                onClick={() => confirmImport(csv)}
                disabled={loading}
                className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                {loading ? 'Importando…' : `Importar ${report.toImportCount} matrícula${report.toImportCount > 1 ? 's' : ''}`}
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
          Use a planilha de matrículas em <b>CSV</b> ou <b>Excel (.xlsx)</b> — a mesma que o site preenche, com todas as colunas.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !loading && document.getElementById('importFile')?.click()}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${loading ? 'opacity-60' : 'cursor-pointer hover:bg-[var(--hover)]'}`}
          style={{ borderColor: dragOver ? '#2F539A' : 'var(--border)' }}
        >
          <FileUp className="w-8 h-8 mx-auto text-brand-light mb-2" />
          <p className="text-sm font-medium">
            {loading ? 'Analisando a planilha…' : (
              <>Arraste o arquivo aqui ou <span className="text-brand-light">clique para escolher</span></>
            )}
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
            <ShieldCheck className="w-4 h-4 shrink-0" /> O que o servidor confere sozinho antes de gravar:
          </p>
          <p>• <b>Linhas repetidas</b> (a mesma matrícula enviada duas vezes) são removidas — só a primeira conta.</p>
          <p>• <b>Quem já está na dashboard</b> não duplica (idempotente: reenviar o mesmo arquivo não cria cópias).</p>
          <p>• <b>Dados inválidos</b> (CPF, telefone, e-mail, datas, endereço fora de GO) ficam de fora — a planilha vem do site, que já valida, então isso quase nunca acontece.</p>
          <p>• Alunos importados chegam <b>sem turma</b> — entram na fila "aguardando turma" para alocar pela Agenda.</p>
        </div>
        {error && (
          <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(220,38,38,.08)', color: '#DC2626' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: error }} />
          </div>
        )}
        <button
          onClick={() => analyze(IMPORT_SAMPLE, 'planilha de exemplo')}
          disabled={loading}
          className="w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkle className="w-4 h-4 text-brand-light" /> Testar com uma planilha de exemplo
        </button>
        <div className="rounded-xl p-3 text-xs text-[var(--muted)] flex items-start gap-1.5" style={{ background: 'var(--hover)' }}>
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>O campo <b>“Na escola desde”</b> não existe na planilha — as matrículas importadas chegam com ele em branco, para preencher depois.</span>
        </div>
        <div className="pt-3 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setPhase({ k: 'wipe' })}
            disabled={loading}
            className="w-full h-10 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
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
