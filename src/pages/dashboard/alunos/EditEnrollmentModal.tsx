import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../components/dashboard/ui/Modal';
import { CSelect } from '../../../components/dashboard/ui/CSelect';
import { DateInput } from '../../../components/dashboard/ui/DatePicker';
import { inputCls, MaskedInput } from '../../../components/dashboard/ui/inputs';
import { useToast } from '../../../components/dashboard/ui/Toast';
import { useAuth } from '../../../lib/dashboard/auth';
import { ApiError } from '../../../lib/dashboard/api';
import { updateEnrollment, logAct } from '../../../lib/dashboard/store';
import { getEnrollmentDetailApi, type EnrollmentDetail, type EnrollmentPatch } from '../../../lib/dashboard/studentsApi';
import {
  ageAtRef,
  BAD_CHARS_MSG,
  badChars,
  esc,
  nivelLabel,
  parseDateBR,
  salaById,
  TURMAS,
  turmaFull,
  turmaShort,
  turmaVagas,
  validCPF,
  validEmail,
  validFullName,
  validPhone,
} from '../../../lib/dashboard/data';
import { NtBox } from './common';

/* Editar matrícula — ligado ao backend (§4.3). Abre a ficha completa
   (GET /enrollments/:id: CPF revelado + ids reais + token de versão), edita e
   salva via PATCH (corpo declarativo) + moveKid para mudança de turma. */

const ckSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const REL_ITEMS = [{ v: '', l: 'Selecione…' }, ...['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Tutor(a)', 'Outro'].map((r) => ({ v: r, l: r }))];

function Sec({ t }: { t: string }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] pt-2">{t}</p>;
}
const isoToBr = (iso: string | null): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : '';
};
const brToIso = (br: string): string | null => {
  const p = parseDateBR(br);
  return p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` : null;
};

/* wrapper: carrega o detalhe e só então monta o formulário */
export function EditEnrollmentModal({ sid, onClose }: { sid: number; onClose: () => void }) {
  const [detail, setDetail] = useState<EnrollmentDetail | null>(null);
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    let alive = true;
    getEnrollmentDetailApi(sid)
      .then((d) => alive && setDetail(d))
      .catch((e) => alive && setLoadErr(e instanceof ApiError ? e.message : 'Não foi possível carregar a matrícula. Recarregue e tente de novo.'));
    return () => {
      alive = false;
    };
  }, [sid]);

  if (loadErr)
    return (
      <Modal title="Editar matrícula" onClose={onClose} footer={<button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">Fechar</button>}>
        <div className="p-5">
          <NtBox msg={loadErr} kind="err" />
        </div>
      </Modal>
    );
  if (!detail)
    return (
      <Modal title="Editar matrícula" size="max-w-xl" onClose={onClose} footer={null}>
        <div className="grid place-content-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-[var(--muted)]" />
        </div>
      </Modal>
    );
  return <EditForm detail={detail} onClose={onClose} />;
}

function EditForm({ detail, onClose }: { detail: EnrollmentDetail; onClose: () => void }) {
  const { toast } = useToast();
  const { effectiveUser } = useAuth();

  const legal = detail.responsibles.find((r) => r.type === 'legal');
  const second = detail.responsibles.find((r) => r.type === 'second');
  const financial = detail.responsibles.find((r) => r.type === 'financial');

  const [kids, setKids] = useState(() => detail.students.map((s) => ({ id: s.id, n: s.name, b: isoToBr(s.birthDate), tid: s.classId ? String(s.classId) : '' })));
  const [rName, setRName] = useState(legal?.name ?? '');
  const [rRel, setRRel] = useState(legal?.relationship ?? '');
  const [rCpf, setRCpf] = useState(legal?.cpf ?? '');
  const [rB, setRB] = useState(isoToBr(legal?.birthDate ?? null));
  const [rPhone, setRPhone] = useState(legal?.phone ?? '');
  const [rEmail, setREmail] = useState(legal?.email ?? '');
  const [secName, setSecName] = useState(second?.name ?? '');
  const [secRel, setSecRel] = useState(second?.relationship ?? '');
  const [secPhone, setSecPhone] = useState(second?.phone ?? '');
  const [secCpf, setSecCpf] = useState(second?.cpf ?? '');
  const [finType, setFinType] = useState<'legal' | 'second' | 'other'>(detail.financialResponsibleType);
  const [finName, setFinName] = useState(financial?.name ?? '');
  const [finCpf, setFinCpf] = useState(financial?.cpf ?? '');
  const [media, setMedia] = useState(detail.authorizationMedia);
  const [cep, setCep] = useState(detail.address?.cep ?? '');
  const [street, setStreet] = useState(detail.address?.street ?? '');
  const [num, setNum] = useState(detail.address?.number ?? '');
  const [comp, setComp] = useState(detail.address?.complement ?? '');
  const [hood, setHood] = useState(detail.address?.neighborhood ?? '');
  const [city, setCity] = useState(detail.address?.city || 'Goiânia');
  const [since, setSince] = useState(isoToBr(detail.students[0]?.atSchoolSince ?? null));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const hasSec = !!secName.trim();
  /* apagou o 2º responsável que era o financeiro → volta o financeiro para o legal */
  useEffect(() => {
    if (!hasSec && finType === 'second') setFinType('legal');
  }, [hasSec, finType]);
  /* turma por aluno: só destinos com vaga (a atual sempre aparece) + "Sem turma" */
  const turmaItemsFor = (origTid: number | null) => [
    { v: '', l: 'Sem turma — fica na fila de alocação', dot: '#B5860B' },
    ...TURMAS.filter((t) => t.id === origTid || !turmaFull(t)).map((t) => ({
      v: String(t.id),
      l: `${turmaShort(t)} · ${nivelLabel(t.nivel)}${t.id === origTid ? ' (atual)' : ` (${turmaVagas(t)} vaga${turmaVagas(t) > 1 ? 's' : ''})`}`,
      dot: salaById(t.sala)!.c,
    })),
  ];
  const finItems = [
    { v: 'legal', l: `Responsável legal${rName.trim() ? ' — ' + rName.trim() : ''}` },
    ...(hasSec ? [{ v: 'second', l: `Segundo responsável${secName.trim() ? ' — ' + secName.trim() : ''}` }] : []),
    { v: 'other', l: 'Outra pessoa' },
  ];

  const save = async () => {
    if (saving) return;
    const gv = (v: string) => v.trim();
    const errs: string[] = [];
    detail.students.forEach((_, i) => {
      const n = gv(kids[i].n), bv = gv(kids[i].b);
      const who = kids.length > 1 ? `Aluno ${i + 1}` : 'Aluno';
      if (!validFullName(n)) errs.push(`${who}: informe nome e sobrenome.`);
      const age = ageAtRef(bv);
      if (age === null) errs.push(`${who}: data de nascimento inválida (dd/mm/aaaa).`);
      else if (age < 1 || age > 20) errs.push(`${who}: a data dá ${age} anos — alunos têm de 1 a 20; confira.`);
    });
    if (!validFullName(rName)) errs.push('Responsável legal: informe nome e sobrenome.');
    if (!gv(rRel)) errs.push('Parentesco do responsável: obrigatório.');
    if (!validCPF(rCpf)) errs.push('CPF do responsável: dígitos inválidos.');
    if (!validPhone(rPhone)) errs.push('Telefone do responsável: DDD + celular com 9.');
    if (!validEmail(rEmail)) errs.push('E-mail do responsável inválido.');
    if (gv(rB)) {
      const a = ageAtRef(rB);
      if (a === null) errs.push('Nascimento do responsável: data inválida.');
      else if (a < 18) errs.push('Nascimento do responsável: precisa ter 18 anos ou mais.');
    }
    if (hasSec) {
      if (!validFullName(secName)) errs.push('Segundo responsável: informe nome e sobrenome (ou apague para remover).');
      if (!validPhone(secPhone)) errs.push('Telefone do segundo responsável: obrigatório quando há segundo responsável.');
      if (gv(secCpf) && !validCPF(secCpf)) errs.push('CPF do segundo responsável com dígitos inválidos — corrija ou deixe vazio.');
      if (!gv(secRel)) errs.push('Parentesco do segundo responsável: obrigatório.');
    }
    if (finType === 'other') {
      if (!validFullName(finName)) errs.push('Responsável financeiro: informe nome e sobrenome.');
      if (!validCPF(finCpf)) errs.push('CPF do responsável financeiro: dígitos inválidos.');
    }
    const cepV = gv(cep);
    if (!/^\d{5}-?\d{3}$/.test(cepV)) errs.push('CEP: obrigatório, no formato 00000-000.');
    if (!gv(street)) errs.push('Rua/avenida: obrigatório.');
    if (!gv(num)) errs.push('Número: obrigatório (use "s/n" se não houver).');
    if (!gv(hood)) errs.push('Bairro: obrigatório.');
    if (!gv(city)) errs.push('Cidade: obrigatório.');
    const sv = gv(since);
    if (sv) {
      const p = parseDateBR(sv);
      if (!p) errs.push('"Na escola desde": data inválida.');
      else if (p.m !== 2 && p.m !== 8) errs.push('"Na escola desde": o semestre começa em fevereiro ou agosto.');
    }
    if ([...kids.map((k) => k.n), rName, rRel, secName, finName, street, comp, hood, city].some(badChars)) errs.push(BAD_CHARS_MSG);
    if (errs.length) {
      setErr('<b>Corrija antes de salvar:</b><br>' + errs.join('<br>'));
      return;
    }

    const sinceIso = sv ? brToIso(sv) : null;
    const body: EnrollmentPatch = {
      expectedUpdatedAt: detail.updatedAt,
      students: kids.map((k) => ({ id: k.id, name: gv(k.n), birthDate: brToIso(gv(k.b)) ?? undefined, atSchoolSince: sinceIso })),
      legalResponsible: { name: gv(rName), cpf: gv(rCpf), phone: gv(rPhone), email: gv(rEmail), relationship: gv(rRel), birthDate: gv(rB) ? brToIso(gv(rB)) : null },
      secondResponsible: hasSec ? { name: gv(secName), phone: gv(secPhone), relationship: gv(secRel), cpf: gv(secCpf) || null } : null,
      financialResponsibleType: finType,
      financialResponsible: finType === 'other' ? { name: gv(finName), cpf: gv(finCpf) } : null,
      address: { cep: cepV, street: gv(street), number: gv(num), complement: gv(comp) || null, neighborhood: gv(hood), city: gv(city) },
      authorizationMedia: media,
    };
    /* turma muda fora do PATCH (regras de capacidade no servidor) */
    const moves = kids
      .map((k, i) => ({ kidId: k.id, classId: k.tid ? +k.tid : null, old: detail.students[i].classId }))
      .filter((m) => m.classId !== m.old)
      .map(({ kidId, classId }) => ({ kidId, classId }));

    setErr('');
    setSaving(true);
    const res = await updateEnrollment(detail.id, body, moves);
    setSaving(false);
    if (!res.ok) {
      if (res.code === 'STALE_WRITE') {
        setErr('A matrícula foi alterada por outra pessoa enquanto você editava. Feche e abra de novo para pegar a versão atual.');
        return;
      }
      const fieldMsgs = res.fields ? Object.values(res.fields) : [];
      setErr('<b>Não foi possível salvar:</b><br>' + (fieldMsgs.length ? fieldMsgs.join('<br>') : esc(res.error)));
      return;
    }
    onClose();
    logAct(effectiveUser?.name ?? 'Equipe', `Editou os dados da matrícula de <b>${esc(kids.map((k) => k.n).join(' e '))}</b>`);
    toast('Dados da matrícula atualizados!');
  };

  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5 h-11 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--hover)] transition text-left">
      <span className={`ck ${on ? 'on' : ''} shrink-0`}>{ckSvg}</span>
      <span className="text-sm">{label}</span>
    </button>
  );

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
            disabled={saving}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <Sec t="Alunos" />
        {kids.map((kv, i) => (
          <div key={kv.id} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium">Aluno {kids.length > 1 ? i + 1 : ''}</span>
                <input className={inputCls} value={kv.n} onChange={(e) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))} />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Nascimento</span>
                <DateInput value={kv.b} onChange={(v) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, b: v } : x)))} startYear={2018} />
              </label>
            </div>
            <div>
              <span className="text-sm font-medium">
                Turma {kids.length > 1 ? 'do aluno ' + (i + 1) : ''} <span className="text-xs font-normal text-[var(--muted)]">(cada aluno tem a sua)</span>
              </span>
              <div className="mt-1.5">
                <CSelect block value={kv.tid} items={turmaItemsFor(detail.students[i].classId)} onChange={(v) => setKids((ks) => ks.map((x, j) => (j === i ? { ...x, tid: v } : x)))} ariaLabel={`Turma do aluno ${i + 1}`} />
              </div>
            </div>
          </div>
        ))}

        <Sec t="Responsável legal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input className={inputCls} value={rName} onChange={(e) => setRName(e.target.value)} />
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
            <MaskedInput mask="phone" value={rPhone} onChange={setRPhone} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-mail</span>
            <input type="email" className={inputCls} value={rEmail} onChange={(e) => setREmail(e.target.value)} />
          </label>
        </div>

        <Sec t="Segundo responsável" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input className={inputCls} placeholder="Deixe vazio se não tiver" value={secName} onChange={(e) => setSecName(e.target.value)} />
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
        <p className="text-xs text-[var(--muted)] -mt-1">Para remover o segundo responsável, apague o nome e salve.</p>

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

        <Sec t="Autorizações" />
        <Toggle on={media} onClick={() => setMedia((m) => !m)} label="Autoriza uso de imagem (fotos)" />

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
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--hover)' }}>
          <label className="block">
            <span className="text-sm font-medium">Na escola desde</span>
            <DateInput value={since} onChange={setSince} startYear={2023} className={`${inputCls} pr-10`} />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Quando o aluno <b>entrou na escola</b> (sempre fevereiro ou agosto) — diferente da data da matrícula. Pode deixar em branco.
          </p>
        </div>
        {err && <NtBox msg={err} kind="err" />}
      </div>
    </Modal>
  );
}
