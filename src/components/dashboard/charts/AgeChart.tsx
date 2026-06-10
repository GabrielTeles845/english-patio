import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { chartColors } from './base';

/* Gráfico "Faixa etária" — port 1:1 do charts.age do preview (l.3882).
   Os 5 baldes (4–6 · 7–9 · 10–12 · 13–15 · 16+) vêm derivados da base
   (refreshOverviewData l.3466) e respeitam a coorte escolhida. */

export function AgeChart({ data, dark }: { data: number[]; dark: boolean }) {
  const c = chartColors(dark);
  const d: ChartData<'bar'> = {
    labels: ['4–6', '7–9', '10–12', '13–15', '16+'],
    datasets: [
      {
        data,
        backgroundColor: ['#FFE17A', '#F5B700', '#2F539A', '#1E3765', '#7C9AD6'],
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 34,
      },
    ],
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text } },
      x: { grid: { display: false }, border: { display: false }, ticks: { color: c.text } },
    },
  };
  return <Bar data={d} options={options} />;
}
