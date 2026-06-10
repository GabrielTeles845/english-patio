import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { chartColors } from './base';

/* "Que horas o pessoal matricula?" — port 1:1 do charts.hours do preview
   (l.3884–3886): barras por hora de chegada da matrícula, top-3 em amarelo,
   tooltip em linguagem de gente ("Por volta das 20h…"). Os dados são os do
   preview (a distribuição que alimentou o gerador da base). */

const HOURS_DATA = [1, 3, 6, 4, 2, 3, 7, 5, 4, 6, 8, 11, 13, 9, 4];
const TOP3 = [...HOURS_DATA].sort((a, b) => b - a).slice(0, 3);

export function HoursChart({ dark }: { dark: boolean }) {
  const c = chartColors(dark);
  const d: ChartData<'bar'> = {
    labels: ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'],
    datasets: [
      {
        data: HOURS_DATA,
        backgroundColor: HOURS_DATA.map((v) => (TOP3.includes(v) ? '#F5B700' : '#2F539A')),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 26,
      },
    ],
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => 'Por volta das ' + items[0].label,
          label: (item) => `${item.parsed.y} matrícula${item.parsed.y === 1 ? '' : 's'} chegaram nesse horário`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text, stepSize: 4 } },
      x: { grid: { display: false }, border: { display: false }, ticks: { color: c.text } },
    },
  };
  return <Bar data={d} options={options} />;
}
