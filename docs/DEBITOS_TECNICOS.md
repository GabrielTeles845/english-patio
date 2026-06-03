# Débitos Técnicos — English Patio

Lista de pendências técnicas conhecidas para resolver depois. Não bloqueiam produção hoje.

## 1. Matrículas duplicadas ao voltar e re-gerar o contrato

**Descoberto em:** Jun/2026

**Sintoma:** Na planilha de matrículas aparecem contratos repetidos da mesma pessoa.

**Causa:** No wizard de matrícula (`src/pages/Enrollment.tsx`), a pessoa preenche tudo,
visualiza o contrato, **volta um passo** e clica em **"gerar contrato"** novamente. Cada
clique dispara `submitEnrollment` (`src/services/enrollmentService.ts`), que faz POST para o
Apps Script — gerando uma nova linha na planilha e um novo PDF no Drive a cada envio.

Como o POST usa `mode: 'no-cors'`, a resposta é opaca e o cliente não sabe se já enviou.

**Ideias de solução (decidir depois):**
- Gerar um `submissionId` (idempotency key) único por sessão de preenchimento e enviá-lo no
  payload; o Apps Script ignora/atualiza se o `submissionId` já existir na planilha.
- Desabilitar o botão de envio após o primeiro clique bem-sucedido e trocar o CTA para
  "matrícula enviada".
- Deduplicar na futura camada de banco (Neon) por (CPF do responsável + nome do aluno +
  janela de tempo curta).

**Prioridade:** Média. Resolver junto com a entrada da dashboard/banco, ou antes se o volume
de duplicatas incomodar a secretaria.
