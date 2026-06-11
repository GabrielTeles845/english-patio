import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { initials, useAuth } from '../../lib/dashboard/auth';
import { apiFetch, ApiError } from '../../lib/dashboard/api';
import { validEmail, validNewPass } from '../../lib/dashboard/data';
import { Modal } from '../../components/dashboard/ui/Modal';
import { inputCls, PasswordInput } from '../../components/dashboard/ui/inputs';
import { NtBox } from './alunos/common';
import { useToast } from '../../components/dashboard/ui/Toast';

/* Modal "Minha conta" — ligado ao backend (DASHBOARD_API §1): PATCH /api/account
   (e-mail único → 409 EMAIL_TAKEN) e POST /api/account/password (confere a atual
   fora do 1º acesso). Edita SEMPRE a conta real (não a persona do "ver como"). */

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const fields = err.fields ? Object.values(err.fields).join(' ') : '';
    return fields || err.message || fallback;
  }
  return fallback;
}

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(user?.email ?? '');
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const e = email.trim();
    if (!validEmail(e)) return setErr('E-mail de acesso inválido.');
    const changingPass = !!(cur || nw || conf);
    if (changingPass) {
      if (!cur) return setErr('Digite a senha atual para trocar a senha.');
      if (!validNewPass(nw)) return setErr('A nova senha precisa de pelo menos 10 caracteres, com letras e números.');
      if (nw !== conf) return setErr('A confirmação não bate com a nova senha — digite igual nos dois campos.');
    }
    const emailChanged = e.toLowerCase() !== (user?.email ?? '').toLowerCase();
    if (!emailChanged && !changingPass) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      if (emailChanged) await apiFetch('/account', { method: 'PATCH', body: JSON.stringify({ email: e }) });
      if (changingPass) await apiFetch('/account/password', { method: 'POST', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
      await refresh();
      onClose();
      toast('Dados da conta atualizados!');
    } catch (e2) {
      setErr(apiMsg(e2, 'Não foi possível salvar.'));
    } finally {
      setBusy(false);
    }
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
          <button onClick={save} disabled={busy} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm disabled:opacity-70" style={{ background: '#1E3765' }}>
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full grid place-content-center font-semibold text-[#15294d]" style={{ background: '#FFE17A' }}>
            {user ? initials(user.name) : ''}
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-[var(--muted)]">{user?.role}</p>
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
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Ao trocar a senha, as outras sessões são encerradas por segurança.
        </p>
        {err && <NtBox msg={err} kind="err" />}
      </div>
    </Modal>
  );
}
