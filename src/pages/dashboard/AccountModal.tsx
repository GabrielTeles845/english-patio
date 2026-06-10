import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { initials, useAuth } from '../../lib/dashboard/auth';
import { validEmail, validNewPass } from '../../lib/dashboard/data';
import { Modal } from '../../components/dashboard/ui/Modal';
import { inputCls, PasswordInput } from '../../components/dashboard/ui/inputs';
import { NtBox } from './alunos/common';
import { useToast } from '../../components/dashboard/ui/Toast';

/* Modal "Minha conta" — port 1:1 de openAccountModal/saveAccount (dashboard.html
   l.5325–5361). E-mail de acesso + trocar senha (validada só se a pessoa começar
   a trocar). Mensagens verbatim do preview. No backend real vira
   PATCH /api/account (e-mail único → 409 EMAIL_TAKEN). */

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const u = effectiveUser;
  const [email, setEmail] = useState(u?.email ?? '');
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');

  const save = () => {
    if (!validEmail(email.trim())) return setErr('E-mail de acesso inválido.');
    /* senha só é validada se a pessoa começou a trocar (algum campo preenchido) */
    if (cur || nw || conf) {
      if (!cur) return setErr('Digite a senha atual para trocar a senha.');
      if (!validNewPass(nw)) return setErr('A nova senha precisa de pelo menos 10 caracteres, com letras e números.');
      if (nw !== conf) return setErr('A confirmação não bate com a nova senha — digite igual nos dois campos.');
    }
    onClose();
    toast('Dados da conta atualizados!');
  };

  return (
    <Modal
      title="Minha conta"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button onClick={save} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm" style={{ background: '#1E3765' }}>
            Salvar alterações
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full grid place-content-center font-semibold text-[#15294d]" style={{ background: '#FFE17A' }}>
            {u ? initials(u.name) : ''}
          </div>
          <div>
            <p className="font-medium">{u?.name}</p>
            <p className="text-xs text-[var(--muted)]">{u?.role}</p>
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-medium">E-mail de acesso</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-2">
            Trocar senha <span className="font-normal text-xs text-[var(--muted)]">(deixe em branco para manter)</span>
          </p>
          <PasswordInput label="Senha atual" value={cur} onChange={setCur} className="mb-2" autoComplete="current-password" />
          <PasswordInput label="Nova senha" value={nw} onChange={setNw} className="mb-2" autoComplete="new-password" />
          <PasswordInput label="Confirmar nova senha" value={conf} onChange={setConf} autoComplete="new-password" />
        </div>
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Ao trocar e-mail ou senha, você recebe uma confirmação no e-mail antigo.
        </p>
        {err && <NtBox msg={err} kind="err" />}
      </div>
    </Modal>
  );
}
