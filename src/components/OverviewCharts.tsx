import { Users } from "lucide-react";

export function OverviewCharts({ compact = false }: { compact?: boolean }) {
  return <div className={`overview-charts ${compact ? "is-compact" : ""}`}>
    <section className="chart-panel">
      <div className="section-heading"><h3>Bemorlar soni</h3><span>Oxirgi 7 kun</span></div>
      <svg viewBox="0 0 300 130" role="img" aria-label="Bemorlar sonining haftalik namunaviy grafigi">
        <defs><linearGradient id={compact ? "chart-fill-small" : "chart-fill"} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" className="chart-stop-top"/><stop offset="100%" className="chart-stop-bottom"/></linearGradient></defs>
        {[20, 45, 70, 95, 120].map(y => <line key={y} x1="26" x2="290" y1={y} y2={y} className="chart-grid"/>)}
        {[26,70,114,158,202,246,290].map(x => <line key={x} x1={x} x2={x} y1="15" y2="120" className="chart-grid"/>)}
        <path d="M26 100 C45 100 56 111 70 102 S97 67 114 72 S144 87 158 68 S184 46 202 55 S226 80 246 65 S277 52 290 28 L290 120 L26 120 Z" fill={`url(#${compact ? "chart-fill-small" : "chart-fill"})`}/>
        <path d="M26 100 C45 100 56 111 70 102 S97 67 114 72 S144 87 158 68 S184 46 202 55 S226 80 246 65 S277 52 290 28" className="chart-line" fill="none"/>
        {[[26,100],[70,102],[114,72],[158,68],[202,55],[246,65],[290,28]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="3" className="chart-dot"/>)}
      </svg>
      <div className="chart-days">{[12,13,14,15,16,17,18].map(d => <span key={d}>{d}.04</span>)}</div>
    </section>
    <section className="chart-panel">
      <div className="section-heading"><h3>Bemorlar taqsimoti</h3><Users size={13}/></div>
      <div className="distribution"><div className="donut"><div><strong>2480</strong><span>Jami</span></div></div><div className="chart-legend"><span><i className="bg-destructive"/>Og‘ir <b>320</b></span><span><i className="bg-warning"/>O‘rta <b>980</b></span><span><i className="bg-success"/>Yengil <b>1180</b></span></div></div>
    </section>
  </div>;
}