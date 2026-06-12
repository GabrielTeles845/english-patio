/* Importação de planilha de matrículas (DASHBOARD_API §4.7). O SERVIDOR é a
   fonte de verdade da análise: faz o parse do CSV, valida (mesmas regras do
   formulário do site), deduplica por submission_id e — no commit — grava só as
   famílias novas e válidas. O front manda o CSV cru (XLSX é convertido para CSV
   antes) e mostra o relatório que volta. */
import { apiFetch } from './api';

/* POST /api/enrollments/import — DRY-RUN: valida + dedup, NÃO grava. */
export interface ImportDryRun {
  toImport: { submissionId: string; studentNames: string[]; responsible: string }[];
  toImportCount: number;
  duplicatesRemoved: number; // linhas repetidas na própria planilha
  alreadyInDb: number; // matrículas que já estavam na dashboard
  needsReview: { rowIndex: number; submissionId: string; reasons: string[] }[]; // linhas com dado a corrigir
}
export async function analyzeImportApi(csv: string, period: string): Promise<ImportDryRun> {
  return apiFetch('/enrollments/import', { method: 'POST', body: JSON.stringify({ csv, period }) });
}

/* POST /api/enrollments/import/commit — grava as famílias novas e válidas
   (idempotente por submission_id; reanalisa o mesmo CSV). */
export interface ImportCommitResult {
  imported: number;
  skipped: number; // já estavam no banco
  needsReview: number;
  duplicatesRemoved: number;
}
export async function commitImportApi(csv: string, period: string): Promise<ImportCommitResult> {
  return apiFetch('/enrollments/import/commit', { method: 'POST', body: JSON.stringify({ csv, period }) });
}
