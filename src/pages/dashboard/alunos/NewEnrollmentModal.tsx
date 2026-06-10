import { useRef, useState } from 'react';
import { Info, Receipt } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { CSelect } from '../../../components/dashboard/ui/CSelect';
import { DateInput } from '../../../components/dashboard/ui/DatePicker';
import { inputCls, MaskedInput } from '../../../components/dashboard/ui/inputs';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { addStudent, logAct } from '../../../lib/dashboard/store';
import {
  ageAtRef,
  BAD_CHARS_MSG,
  badChars,
  cpfOwner,
  esc,
  nivelByK,
  nivelLabel,
  nrmName,
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
} from '../../../lib/dashboard/data';
import { NtBox } from './common';

/* Nova matrícula manual — port de openNewEnrollment/submitNewEnrollment
   (dashboard.html l.3993/4037). Validações verbatim; situações suspeitas mas
   possivelmente legítimas pedem um segundo clique (ntWarnBox). */

export function NewEnrollmentModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();
  const [name, setName] = useState('');
  const [b, setB] = useState('');
  const [tidV, setTidV] = useState('');
  const [resp, setResp] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hood, setHood] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const warnOk = useRef(false);

  const turmaItems = [
    { v: '', l: 'Sem turma — alocar depois pela Agenda', dot: '#B5860B' },
    ...TURMAS.filter((t) => !turmaFull(t)).map((t) => ({
      v: String(t.id),
      l: `${turmaShort(t)} · ${nivelLabel(t.nivel)} (${turmaVagas(t)} vaga${turmaVagas(t) > 1 ? 's' : ''})`,
      dot: salaById(t.sala)!.c,
    })),
  ];

  const submit = () => {
    const nm = name.trim(), bv = b.trim(), rp = resp.trim(), cp = cpf.trim(), ph = phone.trim(), em = email.trim(), hd = hood.trim();
    /* obrigatórios e formatos — nada de placeholder no lugar de dado real (quebraria o banco) */
    const errs: string[] = [];
    if (!validFullName(nm)) errs.push('Nome do aluno: informe nome e sobrenome.');
    const age = ageAtRef(bv);
    if (age === null) errs.push('Nascimento do aluno: use uma data válida (dd/mm/aaaa).');
    else if (age < 1 || age > 20) errs.push(`Nascimento do aluno: a data dá ${age} anos — alunos têm de 1 a 20; confira.`);
    if (!validFullName(rp)) errs.push('Responsável: informe nome e sobrenome.');
    if (!validCPF(cp)) errs.push('CPF do responsável: obrigatório e com dígitos válidos.');
    if (!validPhone(ph)) errs.push('Telefone: DDD + celular com 9, ex.: (62) 99999-0000.');
    if (!validEmail(em)) errs.push('E-mail do responsável inválido.');
    if (!hd) errs.push('Bairro: obrigatório.');
    if ([nm, rp, hd].some(badChars)) errs.push(BAD_CHARS_MSG);
    if (errs.length) {
      warnOk.current = false;
      setWarn('');
      setErr('<b>Corrija antes de adicionar:</b><br>' + errs.join('<br>'));
      return;
    }
    /* mesmo aluno + mesmo responsável = matrícula duplicada de verdade → bloqueia */
    const dup = STUDENTS.find((s) => s.kids.some((k) => nrmName(k.n) === nrmName(nm)) && nrmName(s.resp.n) === nrmName(rp));
    if (dup) {
      setWarn('');
      setErr(`<b>${esc(nm)}</b> já tem matrícula com esse responsável — use ⋮ → Editar dados na existente em vez de criar outra.`);
      return;
    }
    /* situações suspeitas mas possivelmente legítimas → avisa e pede um segundo clique */
    const warns: string[] = [];
    const owner = cpfOwner(cp);
    if (owner && nrmName(owner) !== nrmName(rp))
      warns.push(`Este CPF já está cadastrado no nome de <b>${esc(owner)}</b> — confira se o CPF ou o nome estão certos.`);
    const homon = STUDENTS.find((s) => s.kids.some((k) => nrmName(k.n) === nrmName(nm)));
    if (homon)
      warns.push(`Já existe um aluno chamado <b>${esc(nm)}</b> (responsável: ${esc(homon.resp.n)}) — confira se não é a mesma criança cadastrada duas vezes.`);
    const tid = tidV ? +tidV : null;
    if (tid && age !== null) {
      const nv = nivelByK(turmaById(tid)!.nivel)!;
      if (age < nv.ages[0] - 1 || age > nv.ages[1] + 1)
        warns.push(`A turma escolhida é de <b>${nv.n}</b> (${nv.ages[0]}–${nv.ages[1]} anos) e o aluno tem ${age} — confirme se é isso mesmo.`);
    }
    if (warns.length && !warnOk.current) {
      warnOk.current = true;
      setErr('');
      setWarn(warns.join('<br>') + '<br><b>Se estiver tudo certo, clique de novo em "Adicionar matrícula".</b>');
      return;
    }
    /* a turma pode ter lotado entre abrir o modal e salvar — o store reconfere */
    const res = addStudent({ name: nm, age: age!, b: bv, resp: rp, cpf: cp, phone: ph, email: em, hood: hd, tid });
    if (!res.ok) {
      warnOk.current = false;
      setWarn('');
      setErr(res.error);
      return;
    }
    logAct(effectiveUser?.name ?? 'Equipe', `Adicionou a matrícula de <b>${esc(nm)}</b> manualmente`);
    onClose();
    /* mesmo CPF + mesmo nome = irmãos em matrículas separadas — agrupa como família, sem fricção */
    toast(
      owner && nrmName(owner) === nrmName(rp)
        ? `Matrícula de ${nm.split(' ')[0]} adicionada — agrupada com a família de ${rp.split(' ')[0]}!`
        : `Matrícula de ${nm.split(' ')[0]} adicionada!`,
    );
  };

  return (
    <Modal
      title="Nova matrícula"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            Adicionar matrícula
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nome do aluno</span>
          <input autoFocus placeholder="Nome completo" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nascimento</span>
            <DateInput value={b} onChange={setB} startYear={2018} />
          </label>
          <div>
            <span className="text-sm font-medium">
              Turma <span className="text-xs font-normal text-[var(--muted)]">(dá para alocar depois)</span>
            </span>
            <div className="mt-1.5">
              <CSelect block value={tidV} items={turmaItems} onChange={setTidV} ariaLabel="Turma" />
            </div>
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Responsável legal</span>
          <input placeholder="Nome completo do responsável" className={inputCls} value={resp} onChange={(e) => setResp(e.target.value)} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">CPF do responsável</span>
            <MaskedInput mask="cpf" placeholder="000.000.000-00" value={cpf} onChange={setCpf} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telefone</span>
            <MaskedInput mask="phone" placeholder="(62) 9xxxx-xxxx" value={phone} onChange={setPhone} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">E-mail do responsável</span>
            <input type="email" placeholder="email@exemplo.com" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Bairro</span>
            <input placeholder="Ex.: Setor Bueno" className={inputCls} value={hood} onChange={(e) => setHood(e.target.value)} />
          </label>
        </div>
        <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ background: 'rgba(47,83,154,.07)' }}>
          <div>
            <p className="font-semibold" style={{ color: '#2F539A' }}>
              Boleto Bancário
            </p>
            <p className="text-xs text-[var(--muted)]">Carnê em 6 parcelas — forma única, conforme o contrato</p>
          </div>
          <Receipt className="w-5 h-5" style={{ color: '#2F539A' }} />
        </div>
        {err && <NtBox msg={err} kind="err" />}
        {warn && <NtBox msg={warn} kind="warn" />}
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" /> No produto final este formulário é completo (2º aluno, segundo responsável, endereço
          via CEP, contrato etc.).
        </p>
      </div>
    </Modal>
  );
}
