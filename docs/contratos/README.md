# Contratos

Cópias de referência dos contratos de prestação de serviços. O contrato **ativo** (o que o site preenche e gera nas matrículas) fica em `public/contrato.pdf` — o código carrega esse caminho fixo em `src/services/pdfService.ts`.

| Arquivo | Vigência | Parcelas | Situação |
|---|---|---|---|
| `contrato-2026-anual.pdf` | Janeiro → Dezembro 2026 (12 meses) | 12 | Anual — para matrículas que entram em janeiro |
| `contrato-2026-jul-dez.pdf` | Julho → Dezembro 2026 (6 meses) | 6 | **Ativo** (`public/contrato.pdf`) — segundo semestre |

## Como trocar o contrato ativo

1. Copiar o contrato desejado para `public/contrato.pdf` (manter esse nome — o código depende dele).
2. Conferir as coordenadas de preenchimento em `src/services/pdfService.ts`. Os campos são escritos em posições X/Y absolutas (origem no canto inferior esquerdo).
3. Gerar uma matrícula de teste e validar o PDF preenchido a olho.

### Diferença anual → semestral (medida por coordenadas)

As páginas 1 e 2 e a maior parte da página 4 são idênticas. A única posição de campo que muda é a **linha de assinatura do CONTRATADA** (texto fixo "ENGLISH PATIO LTDA") na página 4, que desceu ~18,8 pt no contrato semestral. No `pdfService.ts` isso corresponde a trocar `page4Height - 667` por `page4Height - 686`. Tudo que vem do formulário (nome, endereço, CEP, CPF, telefone, checkbox de formato, autorização de imagem, data e assinatura do CONTRATANTE) permanece na mesma posição.

O texto impresso muda em alguns trechos (Cláusula 9 vigência/parcelas, Vacation Classes do parágrafo, valor "por aluno"), mas o código não escreve nada nesses pontos — é só conteúdo impresso no PDF.
