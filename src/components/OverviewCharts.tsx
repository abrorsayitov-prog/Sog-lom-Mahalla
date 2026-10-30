import { useStore } from "@/lib/store";

export function OverviewCharts({ compact = false }: { compact?: boolean }) {
  const { patients } = useStore();
  const count = (s: "ogir" | "orta" | "yengil") => patients.filter((p) => p.severity === s).length;
  // The compact variant only appears inside the landing-page mockups, whose stat
  // cards are fixed illustrations — the real panels must show real numbers.
  const stats = compact
    ? { total: 2480, ogir: 320, orta: 980, yengil: 1180 }
    : { total: patients.length, ogir: count("ogir"), orta: count("orta"), yengil: count("yengil") };
  const { total, ogir, orta, yengil } = stats;
  const slice = (n: number) => (n / (total || 1)) * 100;
  const legend = (n: number) => (total ? `${n} (${Math.round(slice(n))}%)` : `${n}`);
  const donutStyle = {
    background: total
      ? `conic-gradient(var(--destructive) 0% ${slice(ogir)}%, var(--warning) ${slice(ogir)}% ${slice(ogir) + slice(orta)}%, var(--success) ${slice(ogir) + slice(orta)}% 100%)`
      : "var(--muted)",
  };
  return (
    <div className={`overview-charts ${compact ? "is-compact" : ""}`}>
      <section className="chart-panel">
        <div className="section-heading">
          <h3>{compact ? "Bemorlar soni (oxirgi 7 kun)" : "Bemorlar soni"}</h3>
          <span>{compact ? `Jami: ${total}` : "7 kun · namunaviy"}</span>
        </div>
        <svg
          viewBox="0 0 300 130"
          role="img"
          aria-label="Bemorlar sonining haftalik namunaviy grafigi"
        >
          <defs>
            <linearGradient
              id={compact ? "chart-fill-small" : "chart-fill"}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" className="chart-stop-top" />
              <stop offset="100%" className="chart-stop-bottom" />
            </linearGradient>
          </defs>
          {[20, 45, 70, 95, 120].map((y) => (
            <line key={y} x1="26" x2="290" y1={y} y2={y} className="chart-grid" />
          ))}
          {compact &&
            [400, 300, 200, 100, 0].map((v, i) => (
              <text key={v} x="22" y={20 + i * 25 + 3} className="chart-axis" textAnchor="end">
                {v}
              </text>
            ))}
          {[26, 70, 114, 158, 202, 246, 290].map((x) => (
            <line key={x} x1={x} x2={x} y1="15" y2="120" className="chart-grid" />
          ))}
          <path
            d="M26 100 C45 100 56 111 70 102 S97 67 114 72 S144 87 158 68 S184 46 202 55 S226 80 246 65 S277 52 290 28 L290 120 L26 120 Z"
            fill={`url(#${compact ? "chart-fill-small" : "chart-fill"})`}
          />
          <path
            d="M26 100 C45 100 56 111 70 102 S97 67 114 72 S144 87 158 68 S184 46 202 55 S226 80 246 65 S277 52 290 28"
            className="chart-line"
            fill="none"
          />
          {[
            [26, 100],
            [70, 102],
            [114, 72],
            [158, 68],
            [202, 55],
            [246, 65],
            [290, 28],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" className="chart-dot" />
          ))}
        </svg>
        <div className="chart-days">
          {[12, 13, 14, 15, 16, 17, 18].map((d) => (
            <span key={d}>{d}.04</span>
          ))}
        </div>
      </section>
      <section className="chart-panel">
        <div className="section-heading">
          <h3>Bemorlar taqsimoti</h3>
        </div>
        <div className="distribution">
          <div className="donut" style={donutStyle}>
            <div>
              <strong>{total}</strong>
              <span>Jami</span>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="bg-destructive" />
              Og‘ir <b>{legend(ogir)}</b>
            </span>
            <span>
              <i className="bg-warning" />
              O‘rta <b>{legend(orta)}</b>
            </span>
            <span>
              <i className="bg-success" />
              Yengil <b>{legend(yengil)}</b>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
