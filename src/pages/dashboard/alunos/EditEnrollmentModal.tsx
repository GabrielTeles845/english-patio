import { useRef, useState } from 'react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { CSelect } from '../../../components/dashboard/ui/CSelect';
import { DateInput } from '../../../components/dashboard/ui/DatePicker';
import { inputCls, MaskedInput } from '../../../components/dashboard/ui/inputs';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { logAct, updateStudent, type StudentPatch } from '../../../lib/dashboard/store';
import {
  activeKidsIn,
  ageAtRef,
  BAD_CHARS_MSG,
  badChars,
  cpfOwner,
  esc,
  nivelLabel,
  nrmName,
  parseDateBR,
  salaById,
  STUDENTS,
  TURMAS,
  turmaById,
  turmaFull,
  turmaShort,
  turmaVagas,
  validCPF,
  validEmail,
  validFullName,
  validPhone,
  type Kid,
} from '../../../lib/dashboard/data';
import { NtBox } from './common';

/* Editar matrícula (CRUD) — port de openEditEnrollment/saveEditEnrollment
   (dashboard.html l.4089/4194). Validação ANTES de aplicar: erro aparece na
   caixa, nada é engolido em silêncio. */

const ckSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function Sec({ t }: { t: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] pt-2">{t}</p>;
}

export function EditEnrollmentModal({ sid, onClose }: { sid: number; onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const s = STUDENTS.find((x) => x.id === sid);
  const [kids, setKids] = useState(() => (s ? s.kids.map((k) => ({ n: k.n, b: k.b, tid: k.tid ? String(k.tid) : '' })) : []));
  const [resp, setResp] = useState(s?.resp.n ?? '');
  const [rel, setRel] = useState(s?.resp.rel ?? '');
  const [cpf, setCpf] = useState(s && s.resp.cpf !== '—' ? s.resp.cpf : '');
  const [rb, setRb] = useState(s && s.resp.b !== '—' ? s.resp.b : '');
  const [phone, setPhone] = useState(s?.resp.phone ?? '');
  const [email, setEmail] = useState(s?.resp.email ?? '');
  const [secN, setSecN] = useState(s?.second?.n ?? '');
  const [secR, setSecR] = useState(s?.second?.rel ?? '');
  const [secP, setSecP] = useState(s?.second?.phone ?? '');
  const [secC, setSecC] = useState(s?.second?.cpf ?? '');
  const [fin, setFin] = useState(s?.fin ?? '');
  const [media, setMedia] = useState(s ? s.media !== false : true);
  const [cep, setCep] = useState(s && s.addr.cep !== '—' ? s.addr.cep : '');
  const [street, setStreet] = useState(s && s.addr.street !== '—' ? s.addr.street : '');
  const [num, setNum] = useState(s?.addr.num ?? '');
  const [comp, setComp] = useState(s?.addr.comp ?? '');
  const [hoodV, setHoodV] = useState(s?.addr.bairro ?? '');
  const [city, setCity] = useState(s?.addr.city || 'Goiânia');
  const [since, setSince] = useState(s?.since ?? '');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const warnOk = useRef(false);

  if (!s) return null;

  /* turma por aluno: só destinos com vaga (a atual sempre aparece) + "Sem turma" (l.4181) */
  const turmaItemsFor = (orig: Kid) => [
    { v: '', l: 'Sem turma — fica na fila de alocação', dot: '#B5860B' },
    ...TURMAS.filter((t) => t.id === orig.tid || !turmaFull(t)).map((t) => ({
      v: String(t.id),
      l: `${turmaShort(t)} · ${nivelLabel(t.nivel)}${t.id === orig.tid ? ' (atual)' : ` (${turmaVagas(t)} vaga${turmaVagas(t) > 1 ? 's' : ''})`}`,
      dot: salaById(t.sala)!.c,
    })),
  ];
  /* cidade: select já marcado com o valor atual (matrículas só em GO, igual ao site) */
  const cities = [...new Set([s.addr.city, 'Goiânia', 'Aparecida de Goiânia'].filter(Boolean))].map((c) => ({ v: c, l: c }));

  const save = () => {
    const gv = (v: string) => v.trim();
    const errs: string[] = [];
    const kidVals: Kid[] = kids.map((kv, i) => {
      const n = gv(kv.n), bv = gv(kv.b);
      const who = s.kids.length > 1 ? `Aluno ${i + 1}` : 'Aluno';
      if (!validFullName(n)) errs.push(`${who}: informe nome e sobrenome.`);
      const age = ageAtRef(bv);
      if (age === null) errs.push(`${who}: data de nascimento inválida (dd/mm/aaaa).`);
      else if (age < 1 || age > 20) errs.push(`${who}: a data dá ${age} anos — alunos têm de 1 a 20; confira.`);
      return { ...s.kids[i], n, b: bv, age: age ?? s.kids[i].age, tid: kv.tid ? +kv.tid : null };
    });
    const rp = gv(resp), rl = gv(rel), cp = gv(cpf), ph = gv(phone), em = gv(email), rbv = gv(rb);
    if (!validFullName(rp)) errs.push('Responsável legal: informe nome e sobrenome.');
    if (!rl) errs.push('Parentesco do responsável: obrigatório (Mãe, Pai, Avó…).');
    if (!validCPF(cp)) errs.push('CPF do responsável: obrigatório e com dígitos válidos.');
    if (!validPhone(ph)) errs.push('Telefone do responsável: DDD + celular com 9, ex.: (62) 99999-0000.');
    if (!validEmail(em)) errs.push('E-mail do responsável inválido.');
    if (rbv) {
      const a = ageAtRef(rbv);
      if (a === null) errs.push('Nascimento do responsável: data inválida.');
      else if (a < 18) errs.push('Nascimento do responsável: precisa ter 18 anos ou mais.');
    }
    /* segundo responsável é opcional — mas, se tem nome, precisa estar consistente */
    const sN = gv(secN), sP = gv(secP), sR = gv(secR), sC = gv(secC);
    if (sN && !validFullName(sN)) errs.push('Segundo responsável: informe nome e sobrenome (ou apague para remover).');
    if (sN && !validPhone(sP)) errs.push('Telefone do segundo responsável: obrigatório quando há segundo responsável.');
    if (sC && !validCPF(sC)) errs.push('CPF do segundo responsável com dígitos inválidos — corrija ou deixe vazio.');
    if (!gv(fin)) errs.push('Responsável financeiro: obrigatório.');
    const cepV = gv(cep);
    if (!/^\d{5}-\d{3}$/.test(cepV)) errs.push('CEP: obrigatório, no formato 00000-000.');
    if (!gv(street)) errs.push('Rua/avenida: obrigatório.');
    if (!gv(num)) errs.push('Número: obrigatório (use "s/n" se não houver).');
    if (!gv(hoodV)) errs.push('Bairro: obrigatório.');
    /* "na escola desde": vazio é permitido; preenchido tem que ser início de semestre (fev/ago) */
    const sv = gv(since);
    if (sv) {
      const p = parseDateBR(sv);
      if (!p) errs.push('"Na escola desde": data inválida.');
      else if (p.m !== 2 && p.m !== 8)
        errs.push('"Na escola desde": o semestre começa em fevereiro ou agosto — use a data de início do semestre de entrada.');
    }
    if ([...kidVals.map((k) => k.n), rp, rl, sN, gv(fin), gv(street), gv(comp), gv(hoodV)].some(badChars)) errs.push(BAD_CHARS_MSG);
    /* vagas: dois irmãos não podem ocupar a mesma última vaga, nem entrar em turma já cheia */
    if (s.active !== false) {
      const delta: Record<number, number> = {};
      kidVals.forEach((kv, i) => {
        const prev = s.kids[i].tid;
        if (prev !== kv.tid) {
          if (kv.tid) delta[kv.tid] = (delta[kv.tid] || 0) + 1;
          if (prev) delta[prev] = (delta[prev] || 0) - 1;
        }
      });
      Object.entries(delta).forEach(([ts, n]) => {
        if (n <= 0) return;
        const t = turmaById(+ts);
        if (!t) return;
        const livre = t.cap - activeKidsIn(t.id);
        if (n > livre)
          errs.push(
            `A turma ${turmaShort(t)} não tem vaga suficiente (${livre > 0 ? `só ${livre} livre${livre > 1 ? 's' : ''}` : 'está cheia'}) para ${n > 1 ? 'os ' + n + ' alunos' : 'este aluno'} — escolha outra ou abra vaga extra pela Agenda.`,
          );
      });
    }
    if (errs.length) {
      warnOk.current = false;
      setWarn('');
      setErr('<b>Corrija antes de salvar:</b><br>' + errs.join('<br>'));
      return;
    }
    /* CPF que já pertence a OUTRO nome → confirmação (mesmo CPF + mesmo nome = família, segue direto) */
    const owner = cpfOwner(cp, sid);
    if (owner && nrmName(owner) !== nrmName(rp) && !warnOk.current) {
      warnOk.current = true;
      setErr('');
      setWarn(
        `Este CPF já está em outra matrícula no nome de <b>${esc(owner)}</b> — confira se o CPF ou o nome estão certos. <b>Se estiver tudo certo, clique de novo em "Salvar alterações".</b>`,
      );
      return;
    }
    warnOk.current = false;
    const patch: StudentPatch = {
      kids: kidVals,
      resp: { ...s.resp, n: rp, rel: rl, cpf: cp, phone: ph, email: em, ...(rbv ? { b: rbv } : {}) },
      /* segundo responsável: nome vazio remove; preenchido cria ou atualiza */
      second: sN ? { n: sN, phone: sP, rel: sR || 'Responsável', ...(sC ? { cpf: sC } : s.second?.cpf ? { cpf: s.second.cpf } : {}) } : null,
      fin: gv(fin),
      media,
      addr: { ...s.addr, cep: cepV, street: gv(street), num: gv(num), comp: gv(comp), bairro: gv(hoodV), city },
      since: sv,
    };
    const res = updateStudent(sid, patch);
    if (!res.ok) {
      setWarn('');
      setErr(res.error);
      return;
    }
    onClose();
    logAct(effectiveUser?.name ?? 'Equipe', `Editou os dados da matrícula de <b>${esc(kidVals.map((k) => k.n).join(' e '))}</b>`);
    toast('Dados da matrícula atualizados!');
  };

  return (
    <Modal
      title="Editar matrícula"
      size="max-w-xl"
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
            Salvar alterações
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <Sec t="Alunos" />
        {kids.map((kv, i) => (
          <div key={i} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium">Aluno {kids.length > 1 ? i + 1 : ''}</span>
                <input
                  className={inputCls}
                  value={kv.n}
                  onChange={(e) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Nascimento</span>
                <DateInput value={kv.b} onChange={(v) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, b: v } : x)))} startYear={2018} />
              </label>
            </div>
            <div>
              <span className="text-sm font-medium">
                Turma {kids.length > 1 ? 'do aluno ' + (i + 1) : ''}{' '}
                <span className="text-xs font-normal text-[var(--muted)]">(cada aluno tem a sua)</span>
              </span>
              <div className="mt-1.5">
                <CSelect
                  block
                  value={kv.tid}
                  items={turmaItemsFor(s.kids[i])}
                  onChange={(v) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, tid: v } : x)))}
                  ariaLabel={`Turma do aluno ${i + 1}`}
                />
              </div>
            </div>
          </div>
        ))}
        <Sec t="Responsável legal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input className={inputCls} value={resp} onChange={(e) => setResp(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Parentesco</span>
            <input className={inputCls} placeholder="Mãe, Pai, Avó…" value={rel} onChange={(e) => setRel(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">CPF</span>
            <MaskedInput mask="cpf" placeholder="000.000.000-00" value={cpf} onChange={setCpf} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nascimento</span>
            <DateInput value={rb} onChange={setRb} startYear={1988} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Telefone</span>
            <MaskedInput mask="phone" value={phone} onChange={setPhone} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mail</span>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <Sec t="Segundo responsável" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input className={inputCls} placeholder="Deixe vazio se não tiver" value={secN} onChange={(e) => setSecN(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Parentesco</span>
            <input className={inputCls} placeholder="Pai, Mãe…" value={secR} onChange={(e) => setSecR(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telefone</span>
            <MaskedInput mask="phone" value={secP} onChange={setSecP} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">
              CPF <span className="text-xs font-normal text-[var(--muted)]">(igual ao formulário do site)</span>
            </span>
            <MaskedInput mask="cpf" placeholder="000.000.000-00" value={secC} onChange={setSecC} />
          </label>
        </div>
        <p className="text-xs text-[var(--muted)] -mt-1">Para remover o segundo responsável, apague o nome e salve.</p>
        <Sec t="Financeiro e autorizações" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <label className="block">
            <span className="text-sm font-medium">Responsável financeiro</span>
            <input className={inputCls} value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
          <button
            type="button"
            onClick={() => setMedia((m) => !m)}
            className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--hover)] transition text-left"
          >
            <span className={`ck ${media ? 'on' : ''} shrink-0`}>{ckSvg}</span>
            <span className="text-sm">Autoriza uso de imagem (fotos)</span>
          </button>
        </div>
        <Sec t="Endereço" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium">CEP</span>
            <MaskedInput mask="cep" placeholder="00000-000" value={cep} onChange={setCep} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Rua / avenida</span>
            <input className={inputCls} value={street} onChange={(e) => setStreet(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Número</span>
            <input className={inputCls} value={num} onChange={(e) => setNum(e.target.value)} />
          </label>
          <label className="block col-span-2">
            <span className="text-sm font-medium">Complemento</span>
            <input className={inputCls} placeholder="Apto, quadra, lote…" value={comp} onChange={(e) => setComp(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_72px] gap-3">
          <label className="block">
            <span className="text-sm font-medium">Bairro</span>
            <input className={inputCls} value={hoodV} onChange={(e) => setHoodV(e.target.value)} />
          </label>
          <div>
            <span className="text-sm font-medium">Cidade</span>
            <div className="mt-1.5">
              <CSelect block value={city} items={cities} onChange={setCity} ariaLabel="Cidade" />
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">UF</span>
            <input
              value="GO"
              readOnly
              className={`${inputCls} opacity-60 cursor-not-allowed text-center`}
              data-tip="Matrículas são só para Goiás — igual ao formulário do site"
            />
          </label>
        </div>
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--hover)' }}>
          <label className="block">
            <span className="text-sm font-medium">Na escola desde</span>
            <DateInput value={since} onChange={setSince} startYear={2023} className={`${inputCls} pr-10`} />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Quando o aluno <b>entrou na escola</b> (sempre fevereiro ou agosto) — diferente da data da matrícula, que mostra só a última
            rematrícula. Pode deixar em branco se ainda não souber.
          </p>
        </div>
        {err && <NtBox msg={err} kind="err" />}
        {warn && <NtBox msg={warn} kind="warn" />}
      </div>
    </Modal>
  );
}
