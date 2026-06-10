import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  CalendarCheck,
  ClipboardList,
  Eye,
  MoreVertical,
  Pencil,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { ROLE_HOME, initials, useAuth, type Role } from '../../lib/dashboard/auth';
import { viewToPath } from '../../lib/dashboard/nav';
import { addUser, logAct, removeUser, setUserActive, updateUser, useDash } from '../../lib/dashboard/store';
import {
  BAD_CHARS_MSG,
  USERS,
  badChars,
  esc,
  validEmail,
  validFullName,
  validNewPass,
  type User,
  type UserRole,
} from '../../lib/dashboard/data';
import { CSelect, type CSelectItem } from '../../components/dashboard/ui/CSelect';
import { EmptyState } from '../../components/dashboard/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/dashboard/ui/Modal';
import { RowMenu, type RowMenuEntry } from '../../components/dashboard/ui/RowMenu';
import { useToast } from '../../components/dashboard/ui/Toast';
import { PasswordInput, inputCls } from '../../components/dashboard/ui/inputs';
import { NtBox } from './alunos/common';

/* Tela USUÁRIOS — port 1:1 da seção data-view="usuarios" do dashboard.html
   (markup l.930–948, JS l.2352–2410 e l.4320–4440: renderUsers, openInvite/
   submitInvite, openUserMenu, openEditUser/saveUser, openRemoveUser/
   confirmRemoveUser, setViewAs). Novo usuário entra com senha provisória
   (decidido 08/Jun — sem convite-link); a guarda do último Diretor vive no
   store (LAST_DIRECTOR, API §10) e a UI mostra o motivo, como no preview.
   Ativar/desativar e "Ver painel como…" por linha entram no ⋮. */

const ROLE_ITEMS: CSelectItem[] = [
  { v: 'diretor', l: 'Diretor' },
  { v: 'supervisor', l: 'Supervisor' },
  { v: 'secretaria', l: 'Secretaria' },
];
const ROLE_BY_KEY: Record<string, UserRole> = { diretor: 'Diretor', supervisor: 'Supervisor', secretaria: 'Secretaria' };
const KEY_BY_ROLE: Record<UserRole, string> = { Diretor: 'diretor', Supervisor: 'supervisor', Secretaria: 'secretaria' };

/* guarda espelhada do store (preview checa ANTES de abrir o modal — l.4414) */
const lastActiveDirector = (u: User): boolean =>
  u.r === 'Diretor' && u.active !== false && USERS.filter((x) => x.r === 'Diretor' && x.active !== false).length === 1;

const gradNavy = { background: 'linear-gradient(135deg,#1E3765,#2F539A)' };

type ModalState =
  | { kind: 'invite' }
  | { kind: 'edit'; id: number }
  | { kind: 'remove'; id: number }
  | { kind: 'deactivate'; id: number }
  | { kind: 'blocked'; id: number; action: 'remover' | 'desativar' }
  | null;

export default function Usuarios() {
  useDash();
  const { effectiveUser, setViewAs } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const who = effectiveUser?.name ?? 'Equipe';

  const [menu, setMenu] = useState<{ anchor: DOMRect; id: number } | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  /* "ver painel como…" (port setViewAs l.2406): faixa âmbar + home do papel + toast verbatim */
  const seeAs = (role: Role) => {
    setViewAs(role);
    navigate(viewToPath(ROLE_HOME[role]));
    toast(`Vendo o painel como ${role} — demonstração dos acessos.`);
  };

  const openMenu = (e: MouseEvent, id: number) => {
    e.stopPropagation();
    setMenu({ anchor: (e.currentTarget as HTMLElement).getBoundingClientRect(), id });
  };

  const menuItems = (u: User): RowMenuEntry[] => {
    const items: RowMenuEntry[] = [
      { icon: <Pencil className="w-4 h-4 text-[var(--muted)]" />, label: 'Editar usuário', onClick: () => setModal({ kind: 'edit', id: u.id }) },
    ];
    if (u.r !== 'Diretor')
      items.push({
        icon: <Eye className="w-4 h-4 text-[var(--muted)]" />,
        label: `Ver painel como ${u.r}`,
        onClick: () => seeAs(u.r),
      });
    if (u.active === false)
      items.push({
        icon: <UserRoundCheck className="w-4 h-4" />,
        label: 'Reativar acesso',
        color: '#16a34a',
        onClick: () => {
          setUserActive(u.id, true);
          logAct(who, `Reativou o acesso de <b>${esc(u.n)}</b> ao painel`);
          toast(`Acesso de ${u.n.split(' ')[0]} reativado.`);
        },
      });
    else
      items.push({
        icon: <Ban className="w-4 h-4 text-[var(--muted)]" />,
        label: 'Desativar acesso',
        onClick: () =>
          setModal(lastActiveDirector(u) ? { kind: 'blocked', id: u.id, action: 'desativar' } : { kind: 'deactivate', id: u.id }),
      });
    items.push('divider', {
      icon: <UserRoundX className="w-4 h-4" />,
      label: 'Remover acesso',
      danger: true,
      onClick: () =>
        setModal(lastActiveDirector(u) ? { kind: 'blocked', id: u.id, action: 'remover' } : { kind: 'remove', id: u.id }),
    });
    return items;
  };

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Usuários &amp; permissões</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">Quem tem acesso ao painel</p>
        </div>
        <button
          onClick={() => setModal({ kind: 'invite' })}
          data-tour="novo-usuario"
          className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
          style={gradNavy}
        >
          <UserPlus className="w-4 h-4" /> Novo usuário
        </button>
      </div>

      {/* lista da equipe (port renderUsers l.2352) */}
      <div className="surface rounded-2xl divide-y" style={{ borderColor: 'var(--border)' }}>
        {USERS.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum usuário ainda"
            sub="Cadastre a equipe para acessar a dashboard — cada pessoa entra com o próprio papel."
          />
        ) : (
          USERS.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 p-4 ${u.active === false ? 'opacity-60' : ''}`}>
              <div
                className="w-10 h-10 rounded-full grid place-content-center text-white font-semibold"
                style={{ background: u.c }}
              >
                {initials(u.n)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {u.n}{' '}
                  {u.pending && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md align-middle"
                      style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}
                    >
                      senha provisória
                    </span>
                  )}
                  {u.active === false && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md align-middle"
                      style={{ background: 'rgba(220,38,38,.10)', color: '#DC2626' }}
                    >
                      desativado
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {u.e} · Último acesso: {u.pending ? 'ainda não entrou' : u.last ?? '—'}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'var(--hover)' }}>
                {u.r}
              </span>
              <button onClick={(e) => openMenu(e, u.id)} data-tip="Ações do usuário" className="p-2 rounded-lg hover:bg-[var(--hover)]">
                <MoreVertical className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* cartões dos 3 papéis (port l.937–947) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" data-tour="papeis">
        <div className="surface rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-brand-light" />
            <h3 className="font-heading font-semibold">Diretor</h3>
          </div>
          <p className="text-sm text-[var(--muted)] flex-1">
            Acesso total: visão geral, alunos, agenda, contratos, modelos, comunicados, editor do site, usuários, registro de
            atividades e configurações.
          </p>
          <p className="mt-3 text-xs text-[var(--muted)] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 shrink-0" /> É a visão atual do painel.
          </p>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-5 h-5 text-brand-light" />
            <h3 className="font-heading font-semibold">Supervisor</h3>
          </div>
          <p className="text-sm text-[var(--muted)] flex-1">
            Cuida da agenda: monta turmas, move alunos entre salas e exporta as imagens. Vê os alunos só para consulta — sem
            editar dados nem mexer em contratos.
          </p>
          <button
            onClick={() => seeAs('Supervisor')}
            className="mt-3 h-9 rounded-xl border border-[var(--border)] text-xs font-semibold hover:bg-[var(--hover)] transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Ver o painel como Supervisor
          </button>
        </div>
        <div className="surface rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-brand-light" />
            <h3 className="font-heading font-semibold">Secretaria</h3>
          </div>
          <p className="text-sm text-[var(--muted)] flex-1">
            Cadastra tudo no dia a dia: alunos, turmas, salas e agenda — e envia/cobra contratos (WhatsApp/download). Não acessa
            comunicados, modelos, editor do site, usuários nem o registro de atividades.
          </p>
          <button
            onClick={() => seeAs('Secretaria')}
            className="mt-3 h-9 rounded-xl border border-[var(--border)] text-xs font-semibold hover:bg-[var(--hover)] transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Ver o painel como Secretaria
          </button>
        </div>
      </div>

      {menu &&
        (() => {
          const u = USERS.find((x) => x.id === menu.id);
          if (!u) return null;
          return <RowMenu anchor={menu.anchor} items={menuItems(u)} onClose={() => setMenu(null)} />;
        })()}

      {modal?.kind === 'invite' && (
        <InviteModal
          onClose={() => setModal(null)}
          onCreated={(n, papel) => {
            logAct(who, `Cadastrou <b>${esc(n)}</b> (${papel}) no painel`);
            toast('Usuário criado! Repasse a senha provisória — a troca é obrigatória no 1º acesso.');
            setModal(null);
          }}
        />
      )}

      {modal?.kind === 'edit' &&
        (() => {
          const u = USERS.find((x) => x.id === modal.id);
          if (!u) return null;
          return (
            <EditModal
              u={u}
              onClose={() => setModal(null)}
              onSaved={() => {
                toast('Usuário atualizado!');
                setModal(null);
              }}
            />
          );
        })()}

      {/* port openRemoveUser (l.4412): card vermelho com avatar + consequência */}
      {modal?.kind === 'remove' &&
        (() => {
          const u = USERS.find((x) => x.id === modal.id);
          if (!u) return null;
          return (
            <ConfirmModal
              title="Remover acesso"
              confirmLabel="Remover acesso"
              onClose={() => setModal(null)}
              onConfirm={() => {
                const res = removeUser(u.id);
                setModal(null);
                if (!res.ok) return toast(res.error.replace(/<[^>]+>/g, ''));
                toast(`Acesso de ${u.n.split(' ')[0]} removido.`);
              }}
            >
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(220,38,38,.06)' }}>
                <div
                  className="w-10 h-10 rounded-full grid place-content-center text-white font-semibold shrink-0"
                  style={{ background: u.c }}
                >
                  {initials(u.n)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[var(--text)]">Remover o acesso de {u.n}?</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    A pessoa não consegue mais entrar no painel. Dá para cadastrar de novo depois, se precisar.
                  </p>
                </div>
              </div>
            </ConfirmModal>
          );
        })()}

      {modal?.kind === 'deactivate' &&
        (() => {
          const u = USERS.find((x) => x.id === modal.id);
          if (!u) return null;
          return (
            <ConfirmModal
              title="Desativar acesso"
              icon={Ban}
              confirmLabel="Desativar acesso"
              onClose={() => setModal(null)}
              onConfirm={() => {
                const res = setUserActive(u.id, false);
                setModal(null);
                if (!res.ok) return toast(res.error.replace(/<[^>]+>/g, ''));
                logAct(who, `Desativou o acesso de <b>${esc(u.n)}</b> ao painel`);
                toast(`Acesso de ${u.n.split(' ')[0]} desativado.`);
              }}
            >
              <p>
                <b className="text-[var(--text)]">{u.n}</b> não consegue mais entrar no painel enquanto o acesso estiver
                desativado. O cadastro e o histórico ficam guardados — dá para reativar quando quiser.
              </p>
            </ConfirmModal>
          );
        })()}

      {/* port do modal "Não dá para remover" (l.4414): a regra do último Diretor */}
      {modal?.kind === 'blocked' &&
        (() => {
          const u = USERS.find((x) => x.id === modal.id);
          if (!u) return null;
          return (
            <Modal title={modal.action === 'remover' ? 'Não dá para remover' : 'Não dá para desativar'} onClose={() => setModal(null)}>
              <div className="p-5 space-y-4">
                <p className="text-sm">
                  <b>{u.n}</b> é a única pessoa com papel Diretor no painel — promova outra pessoa a Diretor antes de{' '}
                  {modal.action} este acesso.
                </p>
                <button
                  onClick={() => setModal(null)}
                  className="w-full h-11 rounded-xl border border-[var(--border)] font-medium text-sm"
                >
                  Entendi
                </button>
              </div>
            </Modal>
          );
        })()}
    </section>
  );
}

/* --- novo usuário (port openInvite/submitInvite l.4320–4356) --- */
function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (n: string, papel: UserRole) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleKey, setRoleKey] = useState('diretor');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const n = name.trim();
    const e = email.trim();
    const errs: string[] = [];
    if (!validFullName(n)) errs.push('Informe nome e sobrenome.');
    if (badChars(n)) errs.push(BAD_CHARS_MSG);
    if (!validEmail(e)) errs.push('E-mail inválido.');
    else if (USERS.some((u) => u.e.toLowerCase() === e.toLowerCase()))
      errs.push(`Já existe um usuário com o e-mail <b>${esc(e)}</b> — cada acesso tem o seu.`);
    if (!validNewPass(pass)) errs.push('A senha provisória precisa de pelo menos 10 caracteres, com letras e números.');
    if (errs.length) return setErr(errs.join('<br>'));
    const papel = ROLE_BY_KEY[roleKey] ?? 'Diretor';
    const res = addUser({ n, e, r: papel });
    if (!res.ok) return setErr(res.error);
    onCreated(n, papel);
  };

  return (
    <Modal
      title="Novo usuário do painel"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
            style={gradNavy}
          >
            <UserPlus className="w-4 h-4" /> Criar usuário
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nome</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className={inputCls}
          />
        </label>
        <div>
          <span className="text-sm font-medium">Papel</span>
          <div className="mt-1.5">
            <CSelect block value={roleKey} items={ROLE_ITEMS} onChange={setRoleKey} ariaLabel="Papel do usuário" />
          </div>
        </div>
        <PasswordInput label="Senha provisória" value={pass} onChange={setPass} autoComplete="new-password" />
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Repasse a senha provisória por um canal seguro — a pessoa é obrigada
          a trocá-la no primeiro acesso. Diretor faz tudo; Supervisor cuida da agenda e consulta alunos; Secretaria cadastra
          alunos e turmas e envia contratos.
        </p>
        <NtBox msg={err} kind="err" />
      </div>
    </Modal>
  );
}

/* --- editar usuário (port openEditUser/saveUser l.4376–4410) --- */
function EditModal({ u, onClose, onSaved }: { u: User; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(u.n);
  const [email, setEmail] = useState(u.e);
  const [roleKey, setRoleKey] = useState(KEY_BY_ROLE[u.r] ?? 'diretor');
  const [err, setErr] = useState('');

  const save = () => {
    const n = name.trim();
    const e = email.trim();
    if (!validFullName(n)) return setErr('Informe nome e sobrenome.');
    if (badChars(n)) return setErr(BAD_CHARS_MSG);
    if (!validEmail(e)) return setErr('E-mail inválido.');
    /* e-mail único + guarda do último Diretor moram no store */
    const res = updateUser(u.id, { n, e, r: ROLE_BY_KEY[roleKey] ?? 'Diretor' });
    if (!res.ok) return setErr(res.error);
    onSaved();
  };

  return (
    <Modal
      title="Editar usuário"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
            Cancelar
          </button>
          <button onClick={save} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm" style={gradNavy}>
            Salvar alterações
          </button>
        </>
      }
    >
      <div className="p-5 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <div>
          <span className="text-sm font-medium">Papel</span>
          <div className="mt-1.5">
            <CSelect block value={roleKey} items={ROLE_ITEMS} onChange={setRoleKey} ariaLabel="Papel do usuário" />
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Diretor tem acesso total; Supervisor cuida da agenda e consulta
          alunos; Secretaria cadastra alunos e turmas e envia contratos.
        </p>
        <NtBox msg={err} kind="err" />
      </div>
    </Modal>
  );
}
