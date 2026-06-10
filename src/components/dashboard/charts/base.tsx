import type { ReactNode } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

/* Base dos gráficos da dashboard — port de buildCharts/chartColors do preview
   (dashboard.html l.3864–3890). Chart.js 4 + react-chartjs-2 (NUNCA Recharts).
   Os defaults globais (fonte Inter + tooltip com a cara da marca) são os
   mesmos do preview; a cor de texto/grid muda com o dark via chartColors(dark)
   passado nas options de cada gráfico (o re-render vem do useTheme().dark). */

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
);

ChartJS.defaults.font.family = 'Inter';
/* tooltip com a cara da marca (em vez do quadradinho padrão) — l.3869 */
Object.assign(ChartJS.defaults.plugins.tooltip, {
  backgroundColor: '#15294d',
  titleColor: '#FFE17A',
  bodyColor: '#fff',
  titleFont: { family: 'Fredoka', size: 13, weight: 600 },
  bodyFont: { family: 'Inter', size: 12 },
  padding: { x: 14, y: 10 },
  cornerRadius: 12,
  displayColors: false,
  caretSize: 6,
});

/* port de chartColors() (l.3864) — grid e texto por tema */
export function chartColors(dark: boolean): { grid: string; text: string } {
  return {
    grid: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    text: dark ? '#93a2bd' : '#64748B',
  };
}

/* Moldura dos gráficos: caixa de altura fixa + overlay "Sem dados ainda"
   (port de applyChartsEmpty, l.1594 — o canvas some com opacity 0 e o
   .chart-empty cobre a área; o CSS já existe em dashboard.css). */
export function ChartShell({
  className = '',
  empty = false,
  children,
}: {
  className?: string;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="h-full w-full" style={empty ? { opacity: 0 } : undefined}>
        {children}
      </div>
      {empty && (
        <div className="chart-empty">
          <span>Sem dados ainda</span>
        </div>
      )}
    </div>
  );
}
