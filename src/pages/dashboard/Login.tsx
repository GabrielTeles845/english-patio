import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ROLE_HOME, useAuth } from '../../lib/dashboard/auth';
import { apiFetch } from '../../lib/dashboard/api';
import { LOGOS } from '../../lib/dashboard/theme';
import { viewToPath } from '../../lib/dashboard/nav';
import { Checkbox } from '../../components/dashboard/ui/Checkbox';
import { useToast } from '../../components/dashboard/ui/Toast';
import { isValidEmail } from '../../utils/validators';

/* Login — port 1:1 da tela do preview (faixa navy de identidade, pattern de
   bolinhas, senha com olhinho, checkbox .ck, modal "Esqueci a senha").
   Ligado ao backend real: POST /api/auth/login e /api/auth/forgot (§1). */

export default function Login() {
  const { user, login } = useAuth();
  const { toast, toastErr } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [sending, setSending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [forgotSending, setForgotSending] = useState(false);

  if (user) return <Navigate to={viewToPath(ROLE_HOME[user.role])} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const logged = await login(email, password);
      navigate(viewToPath(ROLE_HOME[logged.role]), { replace: true });
    } catch (err) {
      toastErr(err instanceof Error ? err.message : 'Não foi possível entrar. Tente de novo.');
    } finally {
      setSending(false);
    }
  };

  const sendForgot = async () => {
    if (!isValidEmail(forgotEmail.trim())) {
      setForgotErr('Digite um e-mail válido para receber o link.');
      return;
    }
    setForgotSending(true);
    try {
      // resposta é sempre 200 (anti-enumeração); a mensagem é a mesma exista ou não.
      await apiFetch('/auth/forgot', { method: 'POST', body: JSON.stringify({ email: forgotEmail.trim() }) });
      setForgotOpen(false);
      setForgotErr('');
      toast('Se o e-mail estiver cadastrado, o link de redefinição foi enviado.');
    } catch {
      toastErr('Não foi possível enviar agora. Tente de novo em instantes.');
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* pattern de bolinhas do site + luz da marca */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(245,183,0,.16) 1.5px,transparent 1.5px)', backgroundSize: '24px 24px' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{ background: 'linear-gradient(to top,rgba(47,83,154,.10),transparent)' }}
      />
      <div className="absolute -top-36 -left-36 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: '#FFE17A' }} />
      <div className="absolute -bottom-44 -right-36 w-[560px] h-[560px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: '#2F539A' }} />

      <div className="relative w-full max-w-[440px]">
        <div className="surface rounded-3xl shadow-2xl overflow-hidden">
          {/* faixa navy de identidade */}
          <div className="relative px-8 pt-7 pb-8 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}>
            <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'rgba(245,183,0,.16)' }} />
            <div className="absolute bottom-3 right-6 w-8 h-8 rounded-full border-[3px] pointer-events-none" style={{ borderColor: 'rgba(255,255,255,.12)' }} />
            <img src={LOGOS.blue} alt="English Patio" className="relative h-12 w-auto" />
            <p className="relative font-heading text-[22px] font-semibold text-white mt-4">Dashboard da escola</p>
            <p className="relative text-sm text-white/60 mt-0.5">Matrículas, alunos, contratos e o site — num lugar só.</p>
            <span className="relative inline-block mt-3.5 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full" style={{ background: '#FFE17A', color: '#15294d' }}>
              MATRÍCULAS ABERTAS · 2º SEMESTRE 2026
            </span>
          </div>
          <form className="p-8 sm:p-9 pt-7" onSubmit={submit}>
            <h2 className="font-heading text-xl font-semibold">Que bom te ver! 👋</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Entre com o seu acesso.</p>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">E-mail</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl px-3 h-11 border border-[var(--border)] focus-within:ring-2 ring-brand-light transition" style={{ background: 'var(--bg)' }}>
                  <Mail className="w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    autoComplete="email"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Senha</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl px-3 h-11 border border-[var(--border)] focus-within:ring-2 ring-brand-light transition" style={{ background: 'var(--bg)' }}>
                  <Lock className="w-4 h-4 text-[var(--muted)]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="p-1 -mr-1 rounded-md text-[var(--muted)] hover:text-brand-light transition"
                    data-tip="Mostrar/ocultar senha"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              <div className="flex items-center justify-between text-sm">
                <Checkbox checked={remember} onChange={setRemember} label="Lembrar de mim" className="text-[var(--muted)]" />
                <button type="button" onClick={() => setForgotOpen(true)} className="font-medium text-brand-light hover:underline">
                  Esqueci a senha
                </button>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full h-11 rounded-xl font-semibold text-white shadow-lg shadow-brand/20 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
              >
                {sending ? 'Entrando…' : 'Entrar'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
        <p className="text-xs text-[var(--muted)] text-center mt-5 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Acesso restrito à equipe da English Patio · versão em construção
        </p>
      </div>

      {/* "Esqueci a senha" */}
      {forgotOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="surface rounded-2xl w-full max-w-sm p-6 fade-in">
            <div className="w-12 h-12 rounded-2xl grid place-content-center mb-4" style={{ background: 'var(--hover)' }}>
              <KeyRound className="w-5 h-5 text-brand-light" />
            </div>
            <h3 className="font-heading text-xl font-semibold">Recuperar senha</h3>
            <p className="text-sm text-[var(--muted)] mt-1">Enviaremos um link de redefinição para o e-mail cadastrado.</p>
            <div className="mt-4 flex items-center gap-2 surface rounded-xl px-3 h-11">
              <Mail className="w-4 h-4 text-[var(--muted)]" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            {forgotErr && <p className="mt-3 text-xs font-medium" style={{ color: '#DC2626' }}>{forgotErr}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setForgotErr('');
                }}
                className="flex-1 h-10 rounded-xl border border-[var(--border)] font-medium text-sm"
              >
                Cancelar
              </button>
              <button onClick={sendForgot} disabled={forgotSending} className="flex-1 h-10 rounded-xl text-white font-semibold text-sm disabled:opacity-70" style={{ background: '#1E3765' }}>
                {forgotSending ? 'Enviando…' : 'Enviar link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
