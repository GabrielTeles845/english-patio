import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Lock, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../../lib/dashboard/api';
import { LOGOS } from '../../lib/dashboard/theme';
import { useToast } from '../../components/dashboard/ui/Toast';

/* Redefinir senha — página PÚBLICA (fora do guard de auth). É onde a pessoa cai
   pelo link do e-mail de recuperação: /dashboard/redefinir?token=… (forgot.ts).
   POST /api/auth/reset { token, password } (DASHBOARD_API §1). Política espelhada
   do server (server/lib/password.ts): >=10 chars, maiúscula, minúscula, número e
   especial. Token inválido/expirado → 400 INVALID_TOKEN, com volta pro login. */

const RULES = [
  { test: (p: string) => p.length >= 10, label: 'Ao menos 10 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uma letra maiúscula' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Uma letra minúscula' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Um número' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Um caractere especial' },
];

/* fundo igual ao do Login (bolinhas + luz da marca) — componente de módulo
   (definir dentro do render remontaria a cada tecla) */
function Backdrop() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(245,183,0,.16) 1.5px,transparent 1.5px)', backgroundSize: '24px 24px' }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ background: 'linear-gradient(to top,rgba(47,83,154,.10),transparent)' }} />
      <div className="absolute -top-36 -left-36 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: '#FFE17A' }} />
      <div className="absolute -bottom-44 -right-36 w-[560px] h-[560px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#2F539A' }} />
    </>
  );
}

/* campo de senha com olhinho — também de módulo, senão o input perde o foco a cada tecla */
function PwInput({
  label, value, set, show, setShow, autoComplete,
}: { label: string; value: string; set: (v: string) => void; show: boolean; setShow: (f: (s: boolean) => boolean) => void; autoComplete: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl px-3 h-11 border border-[var(--border)] focus-within:ring-2 ring-brand-light transition" style={{ background: 'var(--bg)' }}>
        <Lock className="w-4 h-4 text-[var(--muted)]" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => set(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          autoComplete={autoComplete}
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="p-1 -mr-1 rounded-md text-[var(--muted)] hover:text-brand-light transition" data-tip="Mostrar/ocultar senha">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

export default function ResetPassword() {
  const { toast, toastErr } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [tokenBad, setTokenBad] = useState(false);

  const passOk = RULES.every((r) => r.test(pw));
  const match = confirm.length > 0 && pw === confirm;
  const canSubmit = passOk && match && !sending;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    try {
      await apiFetch('/auth/reset', { method: 'POST', body: JSON.stringify({ token, password: pw }) });
      toast('Senha redefinida! Entre com a nova senha.');
      navigate('/dashboard/entrar', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_TOKEN') {
        setTokenBad(true);
      } else if (err instanceof ApiError && err.code === 'WEAK_PASSWORD') {
        toastErr(err.message);
      } else {
        toastErr(err instanceof Error ? err.message : 'Não foi possível redefinir agora. Tente de novo.');
      }
    } finally {
      setSending(false);
    }
  };

  /* sem token na URL, ou token recusado pelo servidor: estado de "link inválido" */
  if (!token || tokenBad) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
        <Backdrop />
        <div className="relative w-full max-w-[440px]">
          <div className="surface rounded-3xl shadow-2xl p-8 sm:p-9 text-center">
            <div className="w-14 h-14 rounded-2xl grid place-content-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,.10)' }}>
              <X className="w-6 h-6" style={{ color: '#DC2626' }} />
            </div>
            <h2 className="font-heading text-xl font-semibold">Link inválido ou expirado</h2>
            <p className="text-sm text-[var(--muted)] mt-1.5">
              Este link de redefinição não vale mais (eles expiram em 1 hora). Volte ao login e peça um novo em “Esqueci a senha”.
            </p>
            <Link
              to="/dashboard/entrar"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
            >
              Voltar ao login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <Backdrop />
      <div className="relative w-full max-w-[440px]">
        <div className="surface rounded-3xl shadow-2xl overflow-hidden">
          {/* faixa navy de identidade */}
          <div className="relative px-8 pt-7 pb-8 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}>
            <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'rgba(245,183,0,.16)' }} />
            <img src={LOGOS.blue} alt="English Patio" className="relative h-12 w-auto" />
            <p className="relative font-heading text-[22px] font-semibold text-white mt-4">Redefinir senha</p>
            <p className="relative text-sm text-white/60 mt-0.5">Escolha uma nova senha para o seu acesso.</p>
          </div>
          <form className="p-8 sm:p-9 pt-7" onSubmit={submit}>
            <div className="w-12 h-12 rounded-2xl grid place-content-center mb-5" style={{ background: 'var(--hover)' }}>
              <KeyRound className="w-5 h-5 text-brand-light" />
            </div>
            <div className="space-y-4">
              <PwInput label="Nova senha" value={pw} set={setPw} show={showPw} setShow={setShowPw} autoComplete="new-password" />

              {/* checklist da política, ao vivo */}
              <ul className="space-y-1">
                {RULES.map((r) => {
                  const ok = r.test(pw);
                  return (
                    <li key={r.label} className="flex items-center gap-2 text-xs" style={{ color: ok ? '#16a34a' : 'var(--muted)' }}>
                      {ok ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 inline-grid place-content-center"><span className="w-1 h-1 rounded-full bg-current opacity-50" /></span>}
                      {r.label}
                    </li>
                  );
                })}
              </ul>

              <PwInput label="Confirmar nova senha" value={confirm} set={setConfirm} show={showConfirm} setShow={setShowConfirm} autoComplete="new-password" />
              {confirm.length > 0 && !match && (
                <p className="text-xs font-medium" style={{ color: '#DC2626' }}>As senhas não conferem.</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-11 rounded-xl font-semibold text-white shadow-lg shadow-brand/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                {sending ? 'Salvando…' : 'Redefinir senha'} <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center">
                <Link to="/dashboard/entrar" className="text-sm font-medium text-brand-light hover:underline">Voltar ao login</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
