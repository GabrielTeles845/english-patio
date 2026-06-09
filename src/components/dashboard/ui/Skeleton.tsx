import type { CSSProperties } from 'react';

/* Skeleton/shimmer — port do skelFor()/flashSkel() do preview (DESIGN.md §8):
   um formato por tipo de tela (cards / tabela / grade / painel / editor),
   exibido a cada navegação (~560ms) e nos loadings reais. */

export type SkeletonKind = 'overview' | 'table' | 'agenda' | 'panel' | 'editor';

function Sk({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skel ${className}`} style={style} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="surface rounded-2xl p-5">{children}</div>;
}

function Head() {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="space-y-2.5">
        <Sk style={{ width: 220, height: 26 }} />
        <Sk style={{ width: 300, height: 13 }} />
      </div>
      <div className="hidden sm:flex gap-2">
        <Sk style={{ width: 120, height: 40, borderRadius: 12 }} />
        <Sk style={{ width: 120, height: 40, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function StatCards({ n }: { n: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: n }, (_, i) => (
        <Card key={i}>
          <Sk className="skel-circle" style={{ width: 40, height: 40 }} />
          <div className="mt-3 space-y-2">
            <Sk style={{ width: '60%', height: 22 }} />
            <Sk style={{ width: '80%', height: 12 }} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChartRow() {
  return (
    <div className="grid lg:grid-cols-2 gap-4 mb-6">
      {[0, 1].map((i) => (
        <Card key={i}>
          <Sk style={{ width: 140, height: 14 }} />
          <div className="mt-4">
            <Sk style={{ width: '100%', height: 200, borderRadius: 12 }} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TableSkel({ rows }: { rows: number }) {
  return (
    <div className="surface rounded-2xl overflow-hidden">
      <div className="p-4 border-b flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Sk key={i} style={{ width: 120, height: 34, borderRadius: 10 }} />
        ))}
        <span className="ml-auto">
          <Sk style={{ width: 160, height: 34, borderRadius: 10 }} />
        </span>
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="px-4 py-3.5 flex items-center gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <Sk className="skel-circle" style={{ width: 38, height: 38 }} />
          <div className="flex-1 space-y-2">
            <Sk style={{ width: '40%', height: 13 }} />
            <Sk style={{ width: '25%', height: 11 }} />
          </div>
          <Sk style={{ width: 90, height: 24, borderRadius: 999 }} />
          <Sk style={{ width: 24, height: 24, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

function GridSkel() {
  return (
    <>
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 3 }, (_, i) => (
          <Sk key={i} style={{ width: 90, height: 36, borderRadius: 999 }} />
        ))}
      </div>
      <div className="surface rounded-2xl p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(6,minmax(0,1fr))' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <Sk key={i} style={{ height: 54, borderRadius: 12 }} />
        ))}
      </div>
    </>
  );
}

function PanelSkel() {
  const line = (w: string, h: number, key: number) => <Sk key={key} style={{ width: w, height: h }} />;
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card>
        <div className="space-y-3">{[line('60%', 16, 0), line('100%', 40, 1), line('100%', 40, 2), line('40%', 40, 3)]}</div>
      </Card>
      <Card>
        <div className="space-y-3">{[line('50%', 16, 0), line('100%', 40, 1), line('100%', 40, 2)]}</div>
      </Card>
      <Card>
        <div className="space-y-3">{[line('55%', 16, 0), line('100%', 40, 1)]}</div>
      </Card>
    </div>
  );
}

function EditorSkel() {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Sk key={i} style={{ width: 90, height: 34, borderRadius: 10 }} />
        ))}
      </div>
      <Sk style={{ width: '100%', height: 420, borderRadius: 16 }} />
    </>
  );
}

export function SkeletonView({ kind }: { kind: SkeletonKind }) {
  return (
    <>
      <Head />
      {kind === 'overview' && (
        <>
          <StatCards n={4} />
          <ChartRow />
        </>
      )}
      {kind === 'agenda' && <GridSkel />}
      {kind === 'editor' && <EditorSkel />}
      {kind === 'panel' && <PanelSkel />}
      {kind === 'table' && <TableSkel rows={8} />}
    </>
  );
}

/* formato de skeleton por tela (mesma regra do skelFor do preview) */
export function skeletonKindFor(view: string): SkeletonKind {
  if (view === 'overview') return 'overview';
  if (view === 'agenda') return 'agenda';
  if (view === 'editor') return 'editor';
  if (view === 'config') return 'panel';
  return 'table';
}
