import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import {
  TOURS,
  TOURS_OFF_KEY,
  isTourMobile,
  tourSeenKey,
  toursOff,
  type TourStep,
} from '../../../lib/dashboard/tours';
import { VIEW_LABEL } from '../../../lib/dashboard/nav';
import { LOGOS, useTheme } from '../../../lib/dashboard/theme';
import { useToast } from './Toast';

/* Motor dos tours guiados — port do tourRender/buildTourDom do preview
   (dashboard.html l.1832–1940): spotlight com box-shadow gigante + 4 painéis
   bloqueadores, halo amarelo pulsante (keyframe tour-pulse no dashboard.css) e
   card .surface posicionado perto do alvo com clamp no viewport. Passos cujo
   alvo não existe no DOM são pulados ao iniciar. Extra sobre o preview:
   navegação por teclado (Enter/setas/Esc). */

interface TourCtx {
  /* abre o tour da tela na hora (botão "?" e Config → "Rever as dicas") */
  startTour: (view: string) => void;
  /* gatilho da navegação: 1ª visita, fora do mobile, sem opt-out (papel
     Diretor é checado pelo chamador, como o preview faz em go() l.1640) */
  maybeTourFor: (view: string) => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function useTour(): TourCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTour fora do TourProvider');
  return ctx;
}

interface TourRun {
  view: string;
  steps: TourStep[];
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [run, setRun] = useState<TourRun | null>(null);
  const [i, setI] = useState(0);
  const activeRef = useRef(false);
  activeRef.current = !!run;

  const startTour = useCallback(
    (view: string) => {
      if (isTourMobile()) {
        toast('Os tours guiados ficam disponíveis no computador.');
        return;
      }
      const all = TOURS[view];
      if (!all) return;
      /* pula passos com alvo ausente (marcadores ainda não portados na tela) */
      const steps = all.filter((s) => !s.target || !!document.querySelector(s.target));
      if (!steps.length) return;
      setI(0);
      setRun({ view, steps });
    },
    [toast]
  );

  const maybeTourFor = useCallback(
    (view: string) => {
      /* não marca como visto no mobile — aparece quando abrir no computador */
      if (isTourMobile()) return;
      if (activeRef.current || toursOff() || !TOURS[view]) return;
      if (localStorage.getItem(tourSeenKey(view))) return;
      localStorage.setItem(tourSeenKey(view), '1');
      window.setTimeout(() => {
        if (!activeRef.current) startTour(view);
      }, 400);
    },
    [startTour]
  );

  const endTour = () => setRun(null);

  const next = () => {
    if (!run) return;
    if (i < run.steps.length - 1) setI(i + 1);
    else setRun(null);
  };

  const prev = () => setI((idx) => Math.max(0, idx - 1));

  const disableTours = () => {
    localStorage.setItem(TOURS_OFF_KEY, '1');
    setRun(null);
    toast('Dicas desativadas — o botão "?" reativa o tour da tela quando quiser.');
  };

  /* teclado: Esc fecha, Enter/→ avança, ← volta (extra sobre o preview) */
  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRun(null);
      else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (i < run.steps.length - 1) setI(i + 1);
        else setRun(null);
      } else if (e.key === 'ArrowLeft') setI((idx) => Math.max(0, idx - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, i]);

  return (
    <Ctx.Provider value={{ startTour, maybeTourFor }}>
      {children}
      {run && (
        <TourOverlay
          view={run.view}
          steps={run.steps}
          i={i}
          onNext={next}
          onPrev={prev}
          onClose={endTour}
          onDisable={disableTours}
        />
      )}
    </Ctx.Provider>
  );
}

/* ---------- overlay (espelho do buildTourDom + tourRender do preview) ---------- */

const DIM = 'rgba(11,19,38,.78)';
const P = 8; /* respiro do spotlight em volta do alvo */

interface OverlayProps {
  view: string;
  steps: TourStep[];
  i: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onDisable: () => void;
}

function TourOverlay({ view, steps, i, onNext, onPrev, onClose, onDisable }: OverlayProps) {
  const { dark } = useTheme();
  const s = steps[i];
  const isLast = i === steps.length - 1;
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstPosRef = useRef(true);

  /* mede o alvo e re-mede em scroll/resize (o scrollIntoView é suave) */
  useLayoutEffect(() => {
    if (!s.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(s.target);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [s]);

  /* posiciona o card (1º card nasce já no lugar, sem deslizar do canto) */
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (firstPosRef.current) {
      card.style.transition = 'none';
      positionCard(card, s, rect);
      requestAnimationFrame(() => {
        card.style.transition = 'left .22s ease-out, top .22s ease-out';
      });
      firstPosRef.current = false;
    } else {
      positionCard(card, s, rect);
    }
  }, [s, rect]);

  const h = rect
    ? { top: rect.top - P, left: rect.left - P, w: rect.width + P * 2, h: rect.height + P * 2 }
    : null;

  const blockers = h
    ? [
        { top: 0, left: 0, width: '100vw', height: Math.max(h.top, 0) },
        { top: h.top + h.h, left: 0, width: '100vw', height: Math.max(window.innerHeight - (h.top + h.h), 0) },
        { top: Math.max(h.top, 0), left: 0, width: Math.max(h.left, 0), height: h.h },
        { top: Math.max(h.top, 0), left: h.left + h.w, width: Math.max(window.innerWidth - (h.left + h.w), 0), height: h.h },
      ]
    : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, pointerEvents: 'none' }}>
      {h ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: h.top,
              left: h.left,
              width: h.w,
              height: h.h,
              borderRadius: 14,
              boxShadow: `0 0 0 100vmax ${DIM}`,
              transition: 'all .22s ease-out',
              pointerEvents: 'none',
            }}
          />
          {blockers.map((b, idx) => (
            <div key={idx} style={{ position: 'fixed', pointerEvents: 'auto', ...b }} />
          ))}
          <div
            style={{
              position: 'fixed',
              top: h.top,
              left: h.left,
              width: h.w,
              height: h.h,
              border: '2px solid #F5B700',
              borderRadius: 14,
              pointerEvents: 'none',
              transition: 'all .22s ease-out',
              animation: 'tour-pulse 1.8s ease-in-out infinite',
            }}
          />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: DIM, pointerEvents: 'auto' }} />
      )}

      <div
        ref={cardRef}
        className="surface"
        style={{
          position: 'fixed',
          width: 'min(330px, calc(100vw - 24px))',
          borderRadius: 18,
          padding: 18,
          boxShadow: '0 16px 40px rgba(0,0,0,.4)',
          pointerEvents: 'auto',
          transition: 'left .22s ease-out, top .22s ease-out',
        }}
      >
        <button
          onClick={onClose}
          data-tip="Fechar tour"
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] transition"
        >
          <X className="w-4 h-4" />
        </button>
        {s.logo && (
          <img src={dark ? LOGOS.blue : LOGOS.colored} alt="English Patio" className="h-12 w-auto mb-3" />
        )}
        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          {s.target
            ? `Dica ${i + 1} de ${steps.length} · ${VIEW_LABEL[view] ?? ''}`
            : isLast
              ? 'Fim do tour'
              : 'Tour rápido'}
        </p>
        <h3 className="font-heading text-lg font-semibold mt-1">{s.title}</h3>
        <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">{s.body}</p>
        <div className="flex items-center gap-1.5 mt-3.5">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all ${idx === i ? 'w-5' : 'w-1.5'}`}
              style={{ background: idx === i ? 'var(--acc)' : 'var(--border)' }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 mt-4">
          {isLast ? (
            <span />
          ) : (
            <button
              onClick={onClose}
              className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover)] transition"
            >
              Pular tour
            </button>
          )}
          <div className="flex gap-2">
            {i > 0 && !isLast && (
              <button
                onClick={onPrev}
                className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium hover:bg-[var(--hover)] transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={isLast ? onClose : onNext}
              className="h-9 px-4 rounded-lg text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#1E3765,#2F539A)' }}
            >
              {isLast ? 'Entendi' : s.target ? 'Próximo' : 'Ver as dicas'}
            </button>
          </div>
        </div>
        <button onClick={onDisable} className="w-full text-center text-[11px] text-[var(--muted)] hover:underline mt-3">
          Não mostrar dicas em nenhuma tela
        </button>
      </div>
    </div>
  );
}

/* port exato do positionTourCard do preview: tenta o placement pedido, cai para
   o oposto (ou o que couber) e clampa nas bordas do viewport */
function positionCard(card: HTMLDivElement, s: TourStep, r: DOMRect | null) {
  const W = Math.min(330, window.innerWidth - 24);
  const G = 14;
  const M = 12;
  const H = card.offsetHeight || 220;
  if (!r || s.placement === 'center') {
    card.style.left = `${Math.max((window.innerWidth - W) / 2, M)}px`;
    card.style.top = `${Math.max((window.innerHeight - H) / 2, M)}px`;
    return;
  }
  const fits = {
    top: r.top - H - G >= M,
    bottom: r.bottom + H + G <= window.innerHeight - M,
    left: r.left - W - G >= M,
    right: r.right + W + G <= window.innerWidth - M,
  };
  let p = s.placement as 'top' | 'bottom' | 'left' | 'right';
  if (!fits[p]) {
    const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[p] as typeof p;
    p = fits[opp] ? opp : fits.bottom ? 'bottom' : fits.top ? 'top' : fits.right ? 'right' : 'left';
  }
  let left: number;
  let top: number;
  if (p === 'top') {
    left = r.left + r.width / 2 - W / 2;
    top = r.top - H - G;
  } else if (p === 'bottom') {
    left = r.left + r.width / 2 - W / 2;
    top = r.bottom + G;
  } else if (p === 'left') {
    left = r.left - W - G;
    top = r.top + r.height / 2 - H / 2;
  } else {
    left = r.right + G;
    top = r.top + r.height / 2 - H / 2;
  }
  card.style.left = `${Math.max(M, Math.min(left, window.innerWidth - W - M))}px`;
  card.style.top = `${Math.max(M, Math.min(top, window.innerHeight - H - M))}px`;
}
