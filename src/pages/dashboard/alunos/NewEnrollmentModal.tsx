import { useState } from 'react';
import { Info, Receipt, Check, Loader2, X } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { CSelect } from '../../../components/dashboard/ui/CSelect';
import { DateInput } from '../../../components/dashboard/ui/DatePicker';
import { inputCls, MaskedInput } from '../../../components/dashboard/ui/inputs';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { createEnrollment, logAct } from '../../../lib/dashboard/store';
import { ageAtRef, BAD_CHARS_MSG, badChars, esc, validCPF, validEmail, validFullName, validPhone } from '../../../lib/dashboard/data';
import { fetchAddress } from '../../../services/cepService';
import type { FormData } from '../../../types/enrollment';
import { NtBox } from './common';

/* Nova matrícula manual — MESMO formulário do site (FormData), no estilo da
   dashboard, ligado ao POST /api/enrollments. O backend revalida tudo e devolve
   os erros por campo; aqui validamos antes (UX) e mostramos o que o backend
   recusar. Alunos entram sem turma (fila), igual ao formulário do site. */

const ckSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function Sec({ t }: { t: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] pt-2">{t}</p>;
}

/* parentesco: rótulos legíveis (iguais aos do Editar matrícula); 1º item = vazio (placeholder) */
const REL_ITEMS = [{ v: '', l: 'Selecione…' }, ...['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Tutor(a)', 'Outro'].map((r) => ({ v: r, l: r }))];

type CepState = 'idle' | 'loading' | 'ok' | 'error';
type CepErr = 'notFound' | 'apisFailed' | 'outsideGoias' | null;

export function NewEnrollmentModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();

  // Alunos
  const [s1Name, setS1Name] = useState('');
  const [s1B, setS1B] = useState('');
  const [hasS2, setHasS2] = useState(false);
  const [s2Name, setS2Name] = useState('');
  const [s2B, setS2B] = useState('');
  // Responsável legal
  const [rName, setRName] = useState('');
  const [rB, setRB] = useState('');
  const [rCpf, setRCpf] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rRel, setRRel] = useState('');
  const [rEmail, setREmail] = useState('');
  // Segundo responsável
  const [hasSec, setHasSec] = useState(false);
  const [secName, setSecName] = useState('');
  const [secCpf, setSecCpf] = useState('');
  const [secPhone, setSecPhone] = useState('');
  const [secRel, setSecRel] = useState('');
  // Financeiro
  const [finType, setFinType] = useState<'legal' | 'second' | 'other'>('legal');
  const [finName, setFinName] = useState('');
  const [finCpf, setFinCpf] = useState('');
  // Endereço
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [comp, setComp] = useState('');
  const [hood, setHood] = useState('');
  const [city, setCity] = useState('Goiânia');
  const [cepState, setCepState] = useState<CepState>('idle');
  const [cepErr, setCepErr] = useState<CepErr>(null);
  // Autorizações
  const [media, setMedia] = useState(false);
  const [aContract, setAContract] = useState(false);
  const [schedOk, setSchedOk] = useState(false);

  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const age1 = ageAtRef(s1B);
  const age2 = ageAtRef(s2B);

  /* CEP: ao completar 8 dígitos, busca nas APIs e preenche (igual ao site).
     Fora de GO ou inexistente bloqueia; APIs fora liberam preenchimento manual. */
  const onCep = async (v: string) => {
    setCep(v);
    const digits = v.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepState('idle');
      setCepErr(null);
      return;
    }
    setCepState('loading');
    setCepErr(null);
    try {
      const r = await fetchAddress(digits);
      if (r.success && r.data) {
        setStreet(r.data.street || '');
        setHood(r.data.neighborhood || '');
        setCity(r.data.city || '');
        setCepState('ok');
      } else if (r.outsideGoias) {
        setCepState('error');
        setCepErr('outsideGoias');
      } else if (r.allApisFailed) {
        setCepState('error');
        setCepErr('apisFailed'); // libera preenchimento manual
      } else {
        setCepState('error');
        setCepErr('notFound');
      }
    } catch {
      setCepState('error');
      setCepErr('apisFailed');
    }
  };

  const buildForm = (): FormData => ({
    student1Name: s1Name.trim(),
    student1BirthDate: s1B.trim(),
    student1Age: age1 != null ? String(age1) : '',
    hasStudent2: hasS2,
    student2Name: hasS2 ? s2Name.trim() : '',
    student2BirthDate: hasS2 ? s2B.trim() : '',
    student2Age: hasS2 && age2 != null ? String(age2) : '',
    responsibleName: rName.trim(),
    responsibleBirthDate: rB.trim(),
    responsibleCPF: rCpf.trim(),
    responsiblePhone: rPhone.trim(),
    responsibleRelationship: rRel.trim(),
    responsibleEmail: rEmail.trim(),
    hasSecondResponsible: hasSec,
    secondResponsibleName: hasSec ? secName.trim() : '',
    secondResponsibleCPF: hasSec ? secCpf.trim() : '',
    secondResponsiblePhone: hasSec ? secPhone.trim() : '',
    secondResponsibleRelationship: hasSec ? secRel.trim() : '',
    financialResponsibleType: finType,
    financialResponsibleName: finType === 'other' ? finName.trim() : '',
    financialResponsibleCPF: finType === 'other' ? finCpf.trim() : '',
    cep: cep.trim(),
    street: street.trim(),
    number: num.trim(),
    complement: comp.trim(),
    neighborhood: hood.trim(),
    city: city.trim(),
    state: 'GO',
    paymentMethod: 'boleto-6x',
    classFormat: 'sede',
    schedule: 'seg-qua',
    scheduleDay1Start: '',
    scheduleDay1End: '',
    scheduleDay2Start: '',
    scheduleDay2End: '',
    authorizationMedia: media,
    authorizationContract: aContract,
    scheduleConfirmed: schedOk,
  });

  /* validação de UX (o backend revalida e é a fonte de verdade) */
  const frontErrors = (): string[] => {
    const e: string[] = [];
    if (!validFullName(s1Name)) e.push('Aluno 1: informe nome e sobrenome.');
    if (age1 == null || age1 < 1 || age1 > 20) e.push('Aluno 1: data de nascimento válida (até 20 anos).');
    if (hasS2) {
      if (!validFullName(s2Name)) e.push('Aluno 2: informe nome e sobrenome.');
      if (age2 == null || age2 < 1 || age2 > 20) e.push('Aluno 2: data de nascimento válida (até 20 anos).');
    }
    if (!validFullName(rName)) e.push('Responsável legal: informe nome e sobrenome.');
    const ageR = ageAtRef(rB);
    if (ageR == null) e.push('Responsável: data de nascimento inválida.');
    else if (ageR < 18) e.push('Responsável: precisa ter 18 anos ou mais.');
    if (!validCPF(rCpf)) e.push('CPF do responsável: dígitos inválidos.');
    if (!validPhone(rPhone)) e.push('Telefone do responsável: DDD + celular com 9.');
    if (!rRel.trim()) e.push('Parentesco do responsável: obrigatório.');
    if (!validEmail(rEmail)) e.push('E-mail do responsável inválido.');
    if (hasSec) {
      if (!validFullName(secName)) e.push('Segundo responsável: informe nome e sobrenome.');
      if (!validCPF(secCpf)) e.push('CPF do segundo responsável: dígitos inválidos.');
      if (!validPhone(secPhone)) e.push('Telefone do segundo responsável: DDD + celular com 9.');
      if (!secRel.trim()) e.push('Parentesco do segundo responsável: obrigatório.');
    }
    if (finType === 'other') {
      if (!validFullName(finName)) e.push('Responsável financeiro: informe nome e sobrenome.');
      if (!validCPF(finCpf)) e.push('CPF do responsável financeiro: dígitos inválidos.');
    }
    if (!/^\d{5}-?\d{3}$/.test(cep.trim())) e.push('CEP: formato 00000-000.');
    else if (cepErr === 'outsideGoias') e.push('CEP fora de Goiás — atendemos só GO.');
    else if (cepErr === 'notFound') e.push('CEP não encontrado — confira o número.');
    else if (cepState === 'loading') e.push('Aguarde a busca do CEP terminar.');
    if (!street.trim()) e.push('Rua/avenida: obrigatório.');
    if (!num.trim()) e.push('Número: obrigatório (use "s/n" se não houver).');
    if (!hood.trim()) e.push('Bairro: obrigatório.');
    if (!city.trim()) e.push('Cidade: obrigatório.');
    if (!aContract) e.push('É preciso aceitar os termos do contrato.');
    if (!schedOk) e.push('Confirme o horário das aulas.');
    if ([s1Name, s2Name, rName, secName, finName, street, comp, hood, city].some(badChars)) e.push(BAD_CHARS_MSG);
    return e;
  };

  const submit = async () => {
    if (submitting) return;
    const errs = frontErrors();
    if (errs.length) {
      setErr('<b>Corrija antes de adicionar:</b><br>' + errs.join('<br>'));
      return;
    }
    setErr('');
    setSubmitting(true);
    const res = await createEnrollment(buildForm());
    setSubmitting(false);
    if (!res.ok) {
      const fieldMsgs = res.fields ? Object.values(res.fields) : [];
      setErr('<b>Não foi possível salvar:</b><br>' + (fieldMsgs.length ? fieldMsgs.join('<br>') : esc(res.error)));
      return;
    }
    logAct(effectiveUser?.name ?? 'Equipe', `Adicionou a matrícula de <b>${esc(s1Name.trim())}</b> manualmente`);
    onClose();
    toast(`Matrícula de ${s1Name.trim().split(' ')[0]} adicionada!`);
  };

  /* botão-checkbox no estilo da dashboard (sem checkbox nativa) */
  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--hover)] transition text-left w-full"
    >
      <span className={`ck ${on ? 'on' : ''} shrink-0`}>{ckSvg}</span>
      <span className="text-sm">{label}</span>
    </button>
  );

  const finItems = [
    { v: 'legal', l: `Responsável legal${rName.trim() ? ' — ' + rName.trim() : ''}` },
    ...(hasSec ? [{ v: 'second', l: `Segundo responsável${secName.trim() ? ' — ' + secName.trim() : ''}` }] : []),
    { v: 'other', l: 'Outra pessoa' },
  ];

  return (
    <Modal
      title="Nova matrícula"
      size="max-w-xl"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Salvando…' : 'Adicionar matrícula'}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <Sec t="Alunos" />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome do aluno</span>
            <input autoFocus placeholder="Nome completo" className={inputCls} value={s1Name} onChange={(e) => setS1Name(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nascimento {age1 != null && <span className="text-xs text-[var(--muted)]">({age1}a)</span>}</span>
            <DateInput value={s1B} onChange={setS1B} startYear={2018} />
          </label>
        </div>
        <Toggle on={hasS2} onClick={() => setHasS2((v) => !v)} label="Adicionar segundo aluno (irmão no mesmo contrato)" />
        {hasS2 && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-3 rounded-xl p-3" style={{ background: 'var(--hover)' }}>
            <label className="block">
              <span className="text-sm font-medium">Nome do 2º aluno</span>
              <input placeholder="Nome completo" className={inputCls} value={s2Name} onChange={(e) => setS2Name(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Nascimento {age2 != null && <span className="text-xs text-[var(--muted)]">({age2}a)</span>}</span>
              <DateInput value={s2B} onChange={setS2B} startYear={2018} />
            </label>
          </div>
        )}

        <Sec t="Responsável legal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome completo</span>
            <input placeholder="Quem assina o contrato" className={inputCls} value={rName} onChange={(e) => setRName(e.target.value)} />
          </label>
          <div>
            <span className="text-sm font-medium">Parentesco</span>
            <div className="mt-1.5">
              <CSelect block value={rRel} items={REL_ITEMS} onChange={setRRel} ariaLabel="Parentesco" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">CPF</span>
            <MaskedInput mask="cpf" placeholder="000.000.000-00" value={rCpf} onChange={setRCpf} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nascimento</span>
            <DateInput value={rB} onChange={setRB} startYear={1988} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Telefone</span>
            <MaskedInput mask="phone" placeholder="(62) 9xxxx-xxxx" value={rPhone} onChange={setRPhone} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mail</span>
            <input type="email" placeholder="email@exemplo.com" className={inputCls} value={rEmail} onChange={(e) => setREmail(e.target.value)} />
          </label>
        </div>

        <Sec t="Segundo responsável (opcional)" />
        <Toggle
          on={hasSec}
          onClick={() => {
            if (hasSec && finType === 'second') setFinType('legal'); // vai desligar: não deixar o financeiro órfão
            setHasSec((v) => !v);
          }}
          label="Adicionar segundo responsável (contato adicional)"
        />
        {hasSec && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl p-3" style={{ background: 'var(--hover)' }}>
            <label className="block">
              <span className="text-sm font-medium">Nome completo</span>
              <input className={inputCls} value={secName} onChange={(e) => setSecName(e.target.value)} />
            </label>
            <div>
              <span className="text-sm font-medium">Parentesco</span>
              <div className="mt-1.5">
                <CSelect block value={secRel} items={REL_ITEMS} onChange={setSecRel} ariaLabel="Parentesco 2º responsável" />
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Telefone</span>
              <MaskedInput mask="phone" value={secPhone} onChange={setSecPhone} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">CPF</span>
              <MaskedInput mask="cpf" placeholder="000.000.000-00" value={secCpf} onChange={setSecCpf} />
            </label>
          </div>
        )}

        <Sec t="Responsável financeiro" />
        <CSelect block value={finType} items={finItems} onChange={(v) => setFinType(v as 'legal' | 'second' | 'other')} ariaLabel="Responsável financeiro" />
        {finType === 'other' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Nome do financeiro</span>
              <input className={inputCls} value={finName} onChange={(e) => setFinName(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">CPF do financeiro</span>
              <MaskedInput mask="cpf" placeholder="000.000.000-00" value={finCpf} onChange={setFinCpf} />
            </label>
          </div>
        )}

        <Sec t="Endereço" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium flex items-center gap-1.5">
              CEP
              {cepState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--muted)]" />}
              {cepState === 'ok' && <Check className="w-3.5 h-3.5 text-green-600" />}
              {cepState === 'error' && <X className="w-3.5 h-3.5 text-red-500" />}
            </span>
            <MaskedInput mask="cep" placeholder="00000-000" value={cep} onChange={onCep} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Rua / avenida</span>
            <input className={inputCls} value={street} onChange={(e) => setStreet(e.target.value)} />
          </label>
        </div>
        {cepErr === 'outsideGoias' && <p className="text-xs text-red-600">CEP fora de Goiás — a escola atende só GO.</p>}
        {cepErr === 'apisFailed' && <p className="text-xs text-amber-600">Busca automática indisponível — preencha o endereço à mão.</p>}
        {cepErr === 'notFound' && <p className="text-xs text-red-600">CEP não encontrado — confira o número.</p>}
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Número</span>
            <input className={inputCls} value={num} onChange={(e) => setNum(e.target.value)} placeholder="123 ou s/n" />
          </label>
          <label className="block col-span-2">
            <span className="text-sm font-medium">Complemento</span>
            <input className={inputCls} placeholder="Apto, quadra, lote…" value={comp} onChange={(e) => setComp(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_72px] gap-3">
          <label className="block">
            <span className="text-sm font-medium">Bairro</span>
            <input className={inputCls} value={hood} onChange={(e) => setHood(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Cidade</span>
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">UF</span>
            <input value="GO" readOnly className={`${inputCls} opacity-60 cursor-not-allowed text-center`} data-tip="Matrículas são só para Goiás" />
          </label>
        </div>

        <Sec t="Pagamento e autorizações" />
        <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ background: 'rgba(47,83,154,.07)' }}>
          <div>
            <p className="font-semibold" style={{ color: '#2F539A' }}>
              Boleto Bancário · aulas na sede
            </p>
            <p className="text-xs text-[var(--muted)]">Carnê em 6 parcelas — forma única, conforme o contrato</p>
          </div>
          <Receipt className="w-5 h-5" style={{ color: '#2F539A' }} />
        </div>
        <Toggle on={media} onClick={() => setMedia((v) => !v)} label="Autoriza uso de imagem (fotos e vídeos)" />
        <Toggle on={aContract} onClick={() => setAContract((v) => !v)} label="A família leu e aceitou os termos do contrato" />
        <Toggle on={schedOk} onClick={() => setSchedOk((v) => !v)} label="O horário das aulas foi confirmado com a família" />

        {err && <NtBox msg={err} kind="err" />}
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" /> O aluno entra sem turma — aloque depois pela Agenda. O contrato é gerado como pendente.
        </p>
      </div>
    </Modal>
  );
}
