import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

/* Donut genérico — port dos charts.sch (Distribuição por horário, cutout 68%,
   l.3881) e charts.pay (Autorização de imagem, cutout 66%, l.3888) do preview.
   Sem legenda interna: a legenda é HTML ao lado, como lá. */

export function DonutChart({
  labels,
  data,
  colors,
  cutout,
}: {
  labels: string[];
  data: number[];
  colors: string[];
  cutout: string;
}) {
  const d: ChartData<'doughnut'> = {
    labels,
    datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }],
  };
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    plugins: { legend: { display: false } },
  };
  return <Doughnut data={d} options={options} />;
}
