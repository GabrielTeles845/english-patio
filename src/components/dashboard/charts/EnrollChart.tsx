import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { PERIOD_DATA } from '../../../lib/dashboard/data';
import { chartColors } from './base';

/* Gráfico "Matrículas" (linha dupla: novas × rematrículas) — port 1:1 do
   charts.enroll do preview (dashboard.html l.3874–3880). O degradê azul sob a
   linha é recriado por scriptable backgroundColor (mesmos stops do preview). */

export type PeriodKey = keyof typeof PERIOD_DATA; // '6m' | 'ano' | 'mes'

const grad = (ctx: ScriptableContext<'line'>) => {
  const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, 'rgba(47,83,154,.35)');
  g.addColorStop(1, 'rgba(47,83,154,0)');
  return g;
};

export function EnrollChart({ period, dark }: { period: PeriodKey; dark: boolean }) {
  const p = PERIOD_DATA[period];
  const c = chartColors(dark);
  const data: ChartData<'line'> = {
    labels: p.labels,
    datasets: [
      {
        data: p.data,
        fill: true,
        backgroundColor: grad,
        borderColor: '#2F539A',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#F5B700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        data: p.rema,
        fill: false,
        borderColor: '#F5B700',
        borderWidth: 2.5,
        borderDash: [6, 5],
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#F5B700',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      },
    ],
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text } },
      x: { grid: { display: false }, border: { display: false }, ticks: { color: c.text } },
    },
  };
  return <Line data={data} options={options} />;
}
