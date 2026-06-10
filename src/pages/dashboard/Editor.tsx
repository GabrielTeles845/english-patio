import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Eye,
  Home,
  Info,
  Lock,
  Menu,
  Monitor,
  MousePointerClick,
  Rocket,
  Smartphone,
  Sparkles,
  Sun,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '../../components/dashboard/ui/Toast';
import { LOGOS } from '../../lib/dashboard/theme';

/* Tela EDITOR DO SITE — port 1:1 da seção data-view="editor" do dashboard.html
   (markup l.861–917, edit panel l.1100–1125, JS l.3556–3843: EDITOR_PAGES,
   renderEditorTabs, setEditorDevice, setEditorPage, páginas réplica do site
   real, openEditFor/liveEdit/restoreOriginal/publishSite). Tudo simulado em
   memória, como no preview: clicar num texto com borda pontilhada amarela abre
   o painel lateral, o texto muda ao vivo, "Publicar" zera as pendências. */

const CLOUD = (f: string) => `https://res.cloudinary.com/dfvihcel2/image/upload/w_700,q_auto:good,f_auto,fl_progressive/${f}`;

type PageKey = 'home' | 'metodologia' | 'vacation' | 'matriculas';

/* PAGE_ICONS (l.3565) — nomes lucide → componentes */
const PAGE_META: Record<PageKey, { label: string; url: string; icon: LucideIcon }> = {
  home: { label: 'Home', url: 'englishpatio.com.br', icon: Home },
  metodologia: { label: 'Metodologia', url: 'englishpatio.com.br/metodologia', icon: BookOpen },
  vacation: { label: 'Vacation Classes', url: 'englishpatio.com.br/vacation-classes', icon: Sun },
  matriculas: { label: 'Matrículas', url: 'englishpatio.com.br/matriculas', icon: ClipboardList },
};
const PAGE_KEYS = Object.keys(PAGE_META) as PageKey[];

/* ====================== ESTADO EM MEMÓRIA (port l.3798) ======================
   EDITS: texto editado por elemento (chave única página|rótulo|texto original);
   PENDING: chaves "Página·Rótulo" não publicadas — a MESMA granularidade do
   pendingEdits do preview. Cache de módulo: sobrevive à ida e volta de tela
   (no preview as edições também só viviam em memória). */
const EDITS: Record<string, string> = {};
const PENDING = new Set<string>();
const cache = { page: 'home' as PageKey, device: 'desktop' as 'desktop' | 'mobile' };

interface EditTarget {
  key: string;
  page: string; // label da página (crumb)
  label: string;
  def: string; // texto original (restaurar)
}

interface EdCtxType {
  pageKey: PageKey;
  editingKey: string | null;
  open: (t: EditTarget) => void;
}
const EdCtx = createContext<EdCtxType | null>(null);

/* ====================== ELEMENTO EDITÁVEL (port ED l.3557) ======================
   `text` é o conteúdo plano (vai pro painel/restaurar); `children` é a versão
   rica opcional (trechos coloridos, ícones) mostrada até o primeiro edit —
   igual ao preview, onde editar troca o innerHTML por textContent. */
function Ed({
  label,
  text,
  tag = 'span',
  cls = '',
  style,
  children,
}: {
  label: string;
  text: string;
  tag?: string;
  cls?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const ctx = useContext(EdCtx)!;
  const key = `${ctx.pageKey}|${label}|${text}`;
  const edited = key in EDITS;
  const editing = ctx.editingKey === key;
  const Tag = tag as ElementType;
  return (
    <Tag
      className={`editable ${cls}${editing ? ' editing' : ''}`}
      style={style}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        ctx.open({ key, page: PAGE_META[ctx.pageKey].label, label, def: text });
      }}
    >
      {edited ? EDITS[key] : (children ?? text)}
    </Tag>
  );
}

/* ====================== PÁGINAS — réplica fiel do site real ====================== */

/* card de feature do hero (port feat l.3603) */
function FeatCard({ t, d }: { t: string; d: string }) {
  return (
    <div className="bg-white/80 rounded-xl p-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full p-1.5" style={{ background: 'rgba(245,183,0,.12)' }}>
          <Check className="w-4 h-4" style={{ color: '#F5B700' }} />
        </div>
        <div className="min-w-0">
          <Ed label="Card — título" text={t} tag="h4" cls="font-semibold text-[#1E3765] text-sm block" />
          <Ed label="Card — descrição" text={d} tag="p" cls="mt-1 text-xs text-gray-500 leading-relaxed block" />
        </div>
      </div>
    </div>
  );
}

/* réplica fiel da Home real (port renderHomePage l.3602 — textos verdadeiros
   de HeroSection.tsx + Navbar) */
function HomePage() {
  const INFRA: [string, string][] = [
    ['Salas Interativas', 'Layout com mesas redondas, livros literários, decoração lúdica e climatização'],
    ['Ambiente Imersivo', 'Murais artísticos e decoração temática que remetem à cultura de língua inglesa'],
    ['Fun Space', 'Sala multiuso com karaokê, cozinha e palco para apresentações em inglês'],
    ['Pátio Amplo', 'Espaço acolhedor com bancos, música ambiente, cesta de basquete e pergolado'],
  ];
  const VAC: [string, string][] = [
    ['8 Encontros por Ano', '2 horas cada'],
    ['Vivências Práticas', 'Parques, supermercados, floriculturas e outros espaços reais'],
    ['Atividades Criativas', 'Culinária, teatro, artesanato, pintura e muito mais'],
    ['100% em Inglês', 'Imersão total no idioma em contextos práticos'],
  ];
  const NIVEIS_ED: [string, string, string[], string][] = [
    ['FUN CONVERSATION', 'Primeiros contatos com o inglês, em uma abordagem totalmente lúdica, com jogos, músicas e atividades interativas. Para crianças de 4 e 5 anos.', ['Fun 1', 'Fun 2'], '#F5B700'],
    ['CONVERSATION SERIES', 'Desenvolvimento da escuta e da fala, com introdução gradual à leitura em inglês.', ['Conv. 1', 'Conv. 2', 'Conv. 3'], '#2F539A'],
    ['POWER TRACK', 'Módulos que desenvolvem as quatro habilidades essenciais, com início das avaliações orais e escritas.', ['POWER 1–6'], '#16a34a'],
    ['SPRINT FLUENCY', 'Desafios práticos com foco em fluência, interpretação e produção escrita. Início da preparação Cambridge.', ['SPRINT 1–4'], '#9333ea'],
    ['CAMBRIDGE PREPARATION', 'Prepare-se para certificações internacionalmente reconhecidas.', ['KET', 'PET', 'FCE'], '#dc2626'],
  ];
  return (
    <div className="bg-white text-left">
      {/* barra de aviso real */}
      <div className="border-b" style={{ background: 'rgba(30,55,101,.05)', borderColor: 'rgba(30,55,101,.10)' }}>
        <Ed
          label="Aviso do topo"
          text="Matrículas abertas para o segundo semestre de 2026!"
          tag="p"
          cls="py-1.5 text-xs text-center font-medium"
          style={{ color: '#1E3765' }}
        />
      </div>
      {/* navbar real */}
      <div className="flex items-center justify-between px-5 sm:px-8 h-16 border-b border-gray-100">
        <img src={LOGOS.colored} alt="English Patio" className="h-10 w-auto" />
        <div className="ep-menu hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: '#1E3765' }}>
          <Ed label="Menu — Home" text="Home" /> <Ed label="Menu — Metodologia" text="Metodologia" />{' '}
          <Ed label="Menu — Vacation" text="Vacation Classes" />
          <Ed
            label="Menu — botão Matrículas"
            text="Matrículas"
            cls="text-white text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: '#1E3765' }}
          />
        </div>
        <Menu className="ep-burger md:hidden w-5 h-5" style={{ color: '#1E3765' }} />
      </div>
      {/* hero real */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-20 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="ep-grid relative grid lg:grid-cols-2 gap-8 p-6 sm:p-10 items-center">
          <div>
            <h2 className="font-bold leading-tight text-3xl sm:text-4xl">
              <Ed label="Título — linha 1" text="Inglês para crianças" cls="block" style={{ color: '#1E3765' }}>
                Inglês para <span style={{ color: '#F5B700' }}>crianças</span>
              </Ed>
              <Ed label="Título — linha 2" text="e adolescentes" cls="block" style={{ color: '#1E3765' }}>
                e <span style={{ color: '#F5B700' }}>adolescentes</span>
              </Ed>
            </h2>
            <Ed
              label="Parágrafo 1"
              text="Somos a English Patio, uma escola de inglês dedicada a construir a fluência com leveza e propósito."
              tag="p"
              cls="mt-5 text-gray-600 leading-relaxed block"
            />
            <Ed
              label="Parágrafo 2"
              text="Adotamos uma abordagem lúdica, dinâmica e contextualizada, voltada ao ensino de crianças e adolescentes organizados em pequenas turmas de até seis alunos."
              tag="p"
              cls="mt-3 text-gray-600 leading-relaxed block"
            />
            <Ed
              label="Parágrafo 3"
              text="Nossa unidade foi cuidadosamente planejada para proporcionar um ambiente acolhedor, inspirador e propício ao desenvolvimento linguístico, cognitivo e pessoal."
              tag="p"
              cls="mt-3 text-gray-600 leading-relaxed block"
            />
            <div className="mt-7 flex flex-wrap gap-3">
              <Ed
                label="Botão primário"
                text="Faça Sua Matrícula"
                cls="inline-flex items-center gap-2 text-white font-semibold text-sm px-5 py-3 rounded-xl"
                style={{ background: '#1E3765' }}
              >
                Faça Sua Matrícula <ArrowRight className="w-4 h-4" />
              </Ed>
              <Ed
                label="Botão secundário"
                text="Conheça Nosso Curso"
                cls="inline-flex items-center font-semibold text-sm px-5 py-3 rounded-xl"
                style={{ background: '#F5B700', color: '#15294d' }}
              />
            </div>
            <div className="ep-feat mt-8 grid sm:grid-cols-2 gap-3">
              <FeatCard t="Aulas 100% em inglês" d="Imersão total no idioma desde a primeira aula" />
              <FeatCard t="Turmas reduzidas" d="Até 6 alunos por turma para atendimento personalizado" />
              <FeatCard t="Metodologia ativa" d="Práticas interativas que priorizam a conversação." />
              <FeatCard t="Espaço que Inspira" d="Infraestrutura que integra conforto, funcionalidade e foco no aprendizado." />
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-2xl overflow-hidden shadow-xl">
                <img src={CLOUD('DSC07398.jpg')} alt="Alunos da English Patio" className="w-full h-52 sm:h-64 object-cover" loading="lazy" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src={CLOUD('DSC07612.jpg')} alt="Momento de leitura" className="w-full h-36 sm:h-44 object-cover" loading="lazy" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src={CLOUD('DSC07695.jpg')} alt="Atividades práticas" className="w-full h-36 sm:h-44 object-cover" loading="lazy" />
              </div>
            </div>
            <div className="ep-badge-float absolute -right-2 top-8 bg-white rounded-2xl shadow-xl px-4 py-3 hidden sm:block">
              <Ed label="Badge flutuante" text="Matrículas Abertas!" tag="p" cls="text-sm font-semibold block" />
            </div>
          </div>
        </div>
      </div>

      {/* infraestrutura (AboutSection) */}
      <div className="ep-sec p-8 sm:p-12" style={{ background: 'linear-gradient(180deg,#eff6ff,#fff)' }}>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Ed label="Infra — título" text="Infraestrutura que Estimula o Aprendizado" tag="h2" cls="ep-title font-heading text-3xl font-semibold block" />
          <Ed
            label="Infra — subtítulo"
            text="A English Patio oferece um ambiente cuidadosamente planejado para promover o aprendizado com conforto, criatividade e acolhimento."
            tag="p"
            cls="mt-3 text-gray-500 block"
          />
        </div>
        <div className="ep-cols grid lg:grid-cols-2 gap-8 items-center">
          <div className="grid sm:grid-cols-2 gap-3">
            {INFRA.map(([t, d]) => (
              <div key={t} className="bg-white rounded-xl p-4 shadow-md">
                <Ed label={`Infra — ${t}`} text={t} tag="h4" cls="font-semibold text-[#1E3765] text-sm block" />
                <Ed label={`Infra — desc. ${t}`} text={d} tag="p" cls="mt-1 text-xs text-gray-500 leading-relaxed block" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={CLOUD('DSC07678.jpg')} alt="Infraestrutura da English Patio" className="w-full h-64 sm:h-80 object-cover" loading="lazy" />
          </div>
        </div>
      </div>

      {/* vacation classes (preview) */}
      <div className="ep-sec p-8 sm:p-12" style={{ background: 'linear-gradient(180deg,#fff,#fff8e1)' }}>
        <div className="ep-row flex flex-col lg:flex-row gap-8 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl shrink-0 w-full lg:w-64">
            <img src={CLOUD('IMG_1250.jpg')} alt="Vacation Classes" className="w-full h-64 lg:h-80 object-cover" loading="lazy" />
          </div>
          <div className="min-w-0">
            <Ed label="Vacation — título" text="Vacation Classes" tag="h2" cls="ep-title font-heading text-3xl font-semibold block" />
            <Ed
              label="Vacation — subtítulo"
              text="Experiências externas que proporcionam aos alunos o uso real e prático do inglês em ambientes do cotidiano"
              tag="p"
              cls="mt-2 text-gray-500 block"
            />
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              {VAC.map(([t, d]) => (
                <div key={t} className="bg-white rounded-xl p-3.5 shadow-md">
                  <Ed label={`Vacation — ${t}`} text={t} tag="h4" cls="font-semibold text-[#1E3765] text-sm block" />
                  <Ed label={`Vacation — desc. ${t}`} text={d} tag="p" cls="mt-1 text-xs text-gray-500 block" />
                </div>
              ))}
            </div>
            <Ed
              label="Vacation — botão"
              text="Conheça as Vacation Classes"
              cls="inline-block mt-5 text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
              style={{ background: '#1E3765' }}
            />
          </div>
        </div>
      </div>

      {/* níveis (CoursesSection) */}
      <div className="ep-sec p-8 sm:p-12 bg-white">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Ed label="Níveis — título" text="Nossos Níveis" tag="h2" cls="ep-title font-heading text-3xl font-semibold block" />
          <Ed
            label="Níveis — subtítulo"
            text="Programa estruturado em níveis progressivos para o desenvolvimento contínuo do aluno"
            tag="p"
            cls="mt-3 text-gray-500 block"
          />
        </div>
        <div className="ep-cols grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NIVEIS_ED.map(([t, d, lv, c]) => (
            <div key={t} className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: '#e5e7eb' }}>
              <div className="px-4 py-2.5" style={{ background: c }}>
                <Ed label={`Nível — ${t}`} text={t} tag="h4" cls="font-bold text-white text-sm tracking-wide block" />
              </div>
              <div className="p-4">
                <Ed label={`Nível — desc. ${t}`} text={d} tag="p" cls="text-xs text-gray-500 leading-relaxed block" />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {lv.map((l) => (
                    <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${c}1a`, color: c }}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-7">
          <Ed
            label="Níveis — botão"
            text="Agende um teste de nível"
            cls="inline-block font-semibold text-sm px-5 py-2.5 rounded-xl"
            style={{ background: '#F5B700', color: '#15294d' }}
          />
        </div>
      </div>

      {/* contato */}
      <div className="ep-sec p-8 sm:p-12" style={{ background: 'linear-gradient(180deg,#eff6ff,#fff)' }}>
        <Ed label="Contato — título" text="Fale Conosco" tag="h2" cls="ep-title font-heading text-3xl font-semibold text-center block" />
        <div className="ep-cols grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-7">
          <div className="bg-white rounded-xl p-5 shadow-md text-center">
            <Ed label="Contato — telefone" text="(62) 3636-7775" tag="p" cls="font-semibold text-[#1E3765] block" />
            <Ed label="Contato — horário 1" text="Seg a Sex: 8:00 - 18:30" tag="p" cls="text-xs text-gray-500 mt-1 block" />
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md text-center">
            <Ed
              label="Contato — endereço"
              text="Av. F, 1541 - Quadra 01 Lote 12, Água Branca, Goiânia - GO"
              tag="p"
              cls="font-semibold text-[#1E3765] text-sm block"
            />
            <Ed label="Contato — horário 2" text="Seg a Sex: 8:00 - 18:30" tag="p" cls="text-xs text-gray-500 mt-1 block" />
          </div>
        </div>
        <div className="text-center mt-5">
          <Ed
            label="Contato — botão WhatsApp"
            text="Fale conosco no WhatsApp"
            cls="inline-flex items-center gap-2 text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
            style={{ background: '#25D366' }}
          />
        </div>
      </div>

      {/* instagram */}
      <div className="ep-sec p-8 sm:p-12 bg-white text-center">
        <Ed label="Instagram — título" text="Siga-nos no Instagram" tag="h2" cls="ep-title font-heading text-3xl font-semibold block" />
        <Ed label="Instagram — subtítulo" text="Acompanhe nosso dia a dia e fique por dentro das novidades!" tag="p" cls="mt-2 text-gray-500 block" />
        <div className="ep-cols grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-7">
          {['DSC07612.jpg', 'DSC07695.jpg', 'DSC07398.jpg'].map((f) => (
            <div key={f} className="rounded-xl overflow-hidden shadow-lg">
              <img src={CLOUD(f)} alt="Post do Instagram" className="w-full h-44 object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <Ed
          label="Instagram — botão"
          text="Ver Mais no Instagram"
          cls="inline-block mt-6 text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#ec4899,#9333ea)' }}
        />
      </div>

      {/* footer */}
      <div className="ep-sec p-8 sm:p-10" style={{ background: '#f8fafc' }}>
        <div className="ep-cols grid md:grid-cols-3 gap-8">
          <div>
            <img src={LOGOS.colored} alt="English Patio" className="h-10 w-auto mb-3" />
            <Ed
              label="Footer — descrição"
              text="Somos a English Patio, uma escola de inglês dedicada a construir a fluência com leveza e propósito."
              tag="p"
              cls="text-xs text-gray-500 leading-relaxed block"
            />
          </div>
          <div>
            <Ed label="Footer — título links" text="Links Rápidos" tag="h4" cls="font-semibold text-[#1E3765] text-sm block mb-2" />
            <p className="text-xs text-gray-500 leading-6">
              <Ed label="Footer — link 1" text="Início" />
              <br />
              <Ed label="Footer — link 2" text="Metodologia" />
              <br />
              <Ed label="Footer — link 3" text="Vacation Classes" />
              <br />
              <Ed label="Footer — link 4" text="Matrículas" />
            </p>
          </div>
          <div>
            <Ed label="Footer — título contato" text="Entre em Contato" tag="h4" cls="font-semibold text-[#1E3765] text-sm block mb-2" />
            <p className="text-xs text-gray-500 leading-6">
              <Ed label="Footer — telefone" text="(62) 3636-7775" />
              <br />
              <Ed label="Footer — e-mail" text="englishpatio@yahoo.com" />
              <br />
              <Ed label="Footer — instagram" text="@englishpatio" />
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-8 pt-4 border-t border-gray-200">
          <Ed label="Footer — copyright" text="© 2026 English Patio. Todos os direitos reservados." />
        </p>
      </div>
    </div>
  );
}

/* nota "no produto final…" das páginas resumidas */
function FinalNote({ text }: { text: string }) {
  return (
    <p className="mt-10 text-xs text-[var(--muted)] flex items-center justify-center gap-1.5">
      <Info className="w-3.5 h-3.5" /> {text}
    </p>
  );
}

function MetodologiaPage() {
  return (
    <div className="bg-white text-center p-10 sm:p-14">
      <Ed
        label="Selo da página"
        text="NOSSA METODOLOGIA"
        cls="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
        style={{ background: '#FFE17A', color: '#15294d' }}
      />
      <Ed label="Título da página" text="Fluência com leveza e propósito" tag="h2" cls="font-heading text-3xl font-semibold block max-w-xl mx-auto" />
      <Ed
        label="Descrição"
        text="Abordagem lúdica, dinâmica e contextualizada: as crianças aprendem fazendo, conversando e brincando — sempre em turmas de até seis alunos."
        tag="p"
        cls="mt-4 text-gray-500 max-w-lg mx-auto block"
      />
      <FinalNote text="No produto final, todas as seções desta página aparecem aqui, editáveis do mesmo jeito." />
    </div>
  );
}

function VacationPage() {
  return (
    <div className="text-center p-10 sm:p-14" style={{ background: 'linear-gradient(180deg,#fff8e1,#fff)' }}>
      <Ed
        label="Selo da página"
        text="FÉRIAS COM INGLÊS"
        cls="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
        style={{ background: '#1E3765', color: '#fff' }}
      />
      <Ed label="Título da página" text="Vacation Classes" tag="h2" cls="font-heading text-3xl font-semibold block" />
      <Ed
        label="Descrição"
        text="As mensalidades dos meses de Janeiro e Julho são convertidas integralmente em vivências: experiências divertidas e imersivas durante as férias."
        tag="p"
        cls="mt-4 text-gray-500 max-w-lg mx-auto block"
      />
      <FinalNote text="No produto final, todas as seções desta página aparecem aqui, editáveis do mesmo jeito." />
    </div>
  );
}

function MatriculasPage() {
  return (
    <div className="bg-white p-10 sm:p-14 max-w-xl mx-auto text-center">
      <Ed label="Título da página" text="Faça sua matrícula" tag="h2" cls="font-heading text-3xl font-semibold block" />
      <Ed
        label="Subtítulo"
        text="Preencha os dados abaixo e gere o contrato em poucos minutos. É rápido, seguro e 100% online."
        tag="p"
        cls="mt-3 text-gray-500 block"
      />
      <div className="mt-8 text-left surface rounded-2xl p-5 space-y-1">
        <Ed label="Passo 1" text="1 · Dados do aluno" tag="p" cls="font-semibold text-sm block" />
        <Ed label="Passo 2" text="2 · Responsáveis" tag="p" cls="text-sm text-gray-400 block" />
        <Ed label="Passo 3" text="3 · Endereço e horário" tag="p" cls="text-sm text-gray-400 block" />
        <Ed label="Passo 4" text="4 · Contrato e assinatura" tag="p" cls="text-sm text-gray-400 block" />
      </div>
      <FinalNote text="Até os textos do formulário de matrícula serão editáveis aqui." />
    </div>
  );
}

const PAGE_RENDER: Record<PageKey, () => ReactNode> = {
  home: () => <HomePage />,
  metodologia: () => <MetodologiaPage />,
  vacation: () => <VacationPage />,
  matriculas: () => <MatriculasPage />,
};

/* ====================== TELA ====================== */

export default function Editor() {
  const { toast } = useToast();
  const [page, setPageState] = useState<PageKey>(cache.page);
  const [device, setDeviceState] = useState<'desktop' | 'mobile'>(cache.device);
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [, setTick] = useState(0);
  const tick = () => setTick((t) => t + 1);

  /* port setEditorPage (l.3594): trocar de página fecha o painel */
  const setPage = (k: PageKey) => {
    cache.page = k;
    setTarget(null);
    setPageState(k);
  };
  const setDevice = (d: 'desktop' | 'mobile') => {
    cache.device = d;
    setDeviceState(d);
  };

  const pendKey = (t: EditTarget) => `${t.page}·${t.label}`;

  /* port liveEdit (l.3816): muda ao vivo + marca pendência */
  const liveEdit = (v: string) => {
    if (!target) return;
    EDITS[target.key] = v;
    PENDING.add(pendKey(target));
    tick();
  };
  /* port restoreOriginal (l.3828) */
  const restoreOriginal = () => {
    if (!target) return;
    delete EDITS[target.key];
    PENDING.delete(pendKey(target));
    tick();
  };
  const finishEdit = () => {
    setTarget(null);
    toast('Texto atualizado na pré-visualização!');
  };
  /* port publishSite (l.3840) */
  const publishSite = () => {
    if (!PENDING.size) {
      toast('Nenhuma alteração para publicar.');
      return;
    }
    PENDING.clear();
    tick();
    toast('Alterações publicadas no site!');
  };

  const curValue = target ? (EDITS[target.key] ?? target.def) : '';
  const pageEl = (
    <EdCtx.Provider value={{ pageKey: page, editingKey: target?.key ?? null, open: setTarget }}>
      <div id="editorPage" className={device === 'mobile' ? 'mob' : ''}>
        {PAGE_RENDER[page]()}
      </div>
    </EdCtx.Provider>
  );

  return (
    <section className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold">Editor do site</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            Esta é a <span className="font-medium text-[var(--text)]">página real do site</span>. Passe o mouse sobre um texto e clique
            para editar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {PENDING.size > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(245,183,0,.16)', color: '#B5860B' }}>
              {PENDING.size} {PENDING.size > 1 ? 'alterações não publicadas' : 'alteração não publicada'}
            </span>
          )}
          <button
            onClick={publishSite}
            data-tour="publish"
            className="h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: '#1E3765' }}
          >
            <Rocket className="w-4 h-4" /> Publicar
          </button>
        </div>
      </div>

      {/* páginas do site + dispositivo */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mr-1 hidden sm:block">Páginas:</span>
        <div className="flex flex-wrap items-center gap-2">
          {PAGE_KEYS.map((k) => {
            const { label, icon: Icon } = PAGE_META[k];
            const on = k === page;
            return (
              <button
                key={k}
                onClick={() => setPage(k)}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm whitespace-nowrap transition ${on ? 'text-white font-semibold shadow-md' : 'surface font-medium text-[var(--muted)] hover:bg-[var(--hover)]'}`}
                style={on ? { background: 'linear-gradient(135deg,#1E3765,#2F539A)', borderColor: 'transparent' } : { borderColor: 'var(--border)' }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center bg-[var(--hover)] rounded-xl p-1 ml-auto">
          <button
            onClick={() => setDevice('desktop')}
            data-tip="Como fica no computador"
            className={`px-3 py-2 rounded-lg ${device === 'desktop' ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--muted)]'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            data-tip="Como fica no celular"
            className={`px-3 py-2 rounded-lg ${device === 'mobile' ? 'bg-[var(--card)] shadow-sm' : 'text-[var(--muted)]'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* moldura desktop (janela mac, chrome escuro) */}
      {device === 'desktop' ? (
        <div className="rounded-2xl overflow-hidden editor-on shadow-xl" style={{ border: '1px solid #16213a' }}>
          <div className="flex items-center gap-2 px-4 h-10" style={{ background: 'linear-gradient(180deg,#1c2740,#141d33)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="ml-3 text-xs rounded-md px-3 py-1 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,.08)', color: '#9fb0cf' }}>
              <Lock className="w-3 h-3" />
              <span>{PAGE_META[page].url}</span>
            </span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider hidden sm:flex items-center gap-1" style={{ color: '#62749a' }}>
              <Eye className="w-3 h-3" /> pré-visualização ao vivo
            </span>
          </div>
          <div className="overflow-y-auto" style={{ background: 'var(--card)', height: 'min(640px,68vh)' }}>
            {pageEl}
          </div>
        </div>
      ) : (
        /* mockup iPhone (calibração lp-valhalla: viewBox cropado + safe area 6.5%) */
        <div className="relative mx-auto editor-on" style={{ width: 'min(380px,90vw)', aspectRatio: '373.5/772.5' }}>
          <div
            className="absolute overflow-hidden bg-white"
            style={{ top: '1.58%', left: '3.96%', width: '92.10%', height: '96.83%', borderRadius: '9%', zIndex: 1 }}
          >
            <div id="phoneScreen" className="absolute inset-x-0 overflow-y-auto bg-white" style={{ top: '6.5%', bottom: 0 }}>
              {pageEl}
            </div>
          </div>
          <svg
            viewBox="533.2 18.8 373.5 772.5"
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: 2 }}
            aria-hidden="true"
          >
            <image href={`${import.meta.env.BASE_URL}assets/iphone.svg`} x="0" y="0" width="1440" height="810" />
            <text
              x="608"
              y="59"
              textAnchor="middle"
              fill="#0f172a"
              fontFamily="-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif"
              fontSize="20"
              fontWeight="600"
            >
              9:41
            </text>
            <g transform="translate(810, 47)">
              <g fill="#0f172a">
                <rect x="0" y="11" width="3.5" height="3.5" rx="0.5" />
                <rect x="5" y="8" width="3.5" height="6.5" rx="0.5" />
                <rect x="10" y="4.5" width="3.5" height="10" rx="0.5" />
                <rect x="15" y="1" width="3.5" height="13.5" rx="0.5" />
              </g>
              <g transform="translate(24, 2)" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round">
                <path d="M 1 6 Q 8 0 15 6" />
                <path d="M 3.5 8.5 Q 8 4.5 12.5 8.5" />
                <circle cx="8" cy="11.5" r="1.4" fill="#0f172a" stroke="none" />
              </g>
              <g transform="translate(46, 2)">
                <rect x="0" y="1.5" width="22" height="11" rx="2.5" fill="none" stroke="#0f172a" strokeWidth="1.2" opacity="0.45" />
                <rect x="22.5" y="5" width="1.6" height="4" rx="0.6" fill="#0f172a" opacity="0.45" />
                <rect x="1.6" y="3.1" width="16" height="7.8" rx="1.2" fill="#0f172a" />
              </g>
            </g>
            <rect x="660" y="768" width="120" height="5" rx="2.5" fill="#0f172a" opacity="0.75" />
          </svg>
        </div>
      )}
      <p className="text-xs text-[var(--muted)] mt-3 flex items-center gap-1.5">
        <MousePointerClick className="w-3.5 h-3.5" /> Dica: a borda pontilhada amarela mostra o que dá para editar. As mudanças aparecem na
        hora na pré-visualização.
      </p>

      {/* ===== EDIT PANEL (port l.1100–1125) — desliza da direita ===== */}
      {createPortal(
        <div
          className="fixed inset-y-0 right-0 z-[80] w-full max-w-sm transition-transform duration-300 surface border-l shadow-2xl flex flex-col"
          style={{ borderColor: 'var(--border)', transform: target ? 'translateX(0)' : 'translateX(100%)' }}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h3 className="font-heading font-semibold text-lg leading-tight">Editar texto</h3>
              <p className="text-[11px] text-[var(--muted)]">{target ? `${target.page} · ${target.label}` : ''}</p>
            </div>
            <button onClick={() => setTarget(null)} className="p-2 rounded-lg hover:bg-[var(--hover)]" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Conteúdo</label>
              <span className="text-[11px] text-[var(--muted)]">{curValue.length} caracteres</span>
            </div>
            <textarea
              rows={6}
              value={curValue}
              onChange={(e) => liveEdit(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm outline-none focus:ring-2 ring-brand-light resize-none"
            />
            <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: 'rgba(245,183,0,.10)', color: '#8a6a09' }}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B5860B' }} />
              <span>
                O texto muda <strong>ao vivo</strong> na pré-visualização enquanto você digita. Nada vai pro site até clicar em{' '}
                <strong>Publicar</strong>.
              </span>
            </div>
            <button
              onClick={restoreOriginal}
              className="mt-4 w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--hover)] transition"
            >
              <Undo2 className="w-4 h-4" /> Restaurar texto original
            </button>
          </div>
          <div className="p-5 border-t flex gap-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setTarget(null)} className="flex-1 h-11 rounded-xl border border-[var(--border)] font-medium text-sm">
              Fechar
            </button>
            <button
              onClick={finishEdit}
              className="flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: '#1E3765' }}
            >
              <Check className="w-4 h-4" /> Concluir
            </button>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
