import styles from './agent-mission-control.module.css';

type MiniTerminalLine = { kind: 'prompt' | 'muted' | 'ok' | 'warn' | 'text'; text: string };

function MiniTerminal({
  title,
  lines,
  className,
}: {
  title: string;
  lines: MiniTerminalLine[];
  className?: string;
}) {
  return (
    <div className={`${styles.panel} ${styles.terminal} ${className ?? ''}`}>
      <div className={styles.panelHeader}>
        <span className={styles.dots}>
          <span className={`${styles.dot} ${styles.red}`} />
          <span className={`${styles.dot} ${styles.yellow}`} />
          <span className={`${styles.dot} ${styles.green}`} />
        </span>
        <span className={styles.panelTitle}>{title}</span>
      </div>
      <div className={styles.terminalBody} aria-label={title}>
        {lines.map((line, idx) => (
          <div key={idx} className={styles.termLine}>
            <span className={styles[`term_${line.kind}` as const]}>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  trend = 'up',
  className,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}) {
  return (
    <div className={`${styles.panel} ${styles.statCard} ${className ?? ''}`}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <span
          className={`${styles.trend} ${
            trend === 'up' ? styles.up : trend === 'down' ? styles.down : styles.flat
          }`}
        >
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'}
        </span>
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  );
}

function OrdersPanel({ className }: { className?: string }) {
  return (
    <div className={`${styles.panel} ${styles.orders} ${className ?? ''}`}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Orders</span>
        <span className={styles.pill}>Last 24h</span>
      </div>
      <div className={styles.ordersBody}>
        <div className={styles.ordersGrid}>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>Revenue</div>
            <div className={styles.ordersKpiValue}>$18,420</div>
            <div className={styles.ordersKpiSub}>+12.3%</div>
          </div>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>Orders</div>
            <div className={styles.ordersKpiValue}>2,847</div>
            <div className={styles.ordersKpiSub}>+4.8%</div>
          </div>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>AOV</div>
            <div className={styles.ordersKpiValue}>$6.47</div>
            <div className={styles.ordersKpiSub}>-1.1%</div>
          </div>
        </div>
        <div className={styles.ordersChart}>
          <div className={styles.chartHeader}>
            <span className={styles.chartLabel}>Last 7 days</span>
            <span className={styles.chartLegend}>
              <span className={styles.legendDot} />
              Revenue
            </span>
          </div>
          <div className={styles.chartBars} aria-hidden="true">
            {Array.from({ length: 12 }).map((_, idx) => (
              <span
                key={idx}
                className={styles.chartBar}
                style={{ height: `${22 + ((idx * 17) % 58)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentMissionControlSection() {
  return (
    <section className={styles.section} aria-label="Agent mission control">
      <div className={styles.sectionInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Infinite canvas for developers</p>
          <h2 className={styles.title}>
            <span className={styles.titleBright}>The mission control</span>
            <span className={styles.titleItalic}>for AI coding agents.</span>
          </h2>
          <p className={styles.sub}>
            Keep terminals, dashboards, and context in one place. No constant tab switching — just a
            clean surface that stays out of the way until you need it.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryCta} href="/sign-in">
              Choose platform
            </a>
            <a className={styles.secondaryCta} href="#features">
              See features →
            </a>
          </div>
        </div>

        <div className={styles.canvas} role="img" aria-label="Floating panels canvas preview">
          <div className={styles.glow} aria-hidden="true" />

          <MiniTerminal
            className={styles.floatLeft}
            title="agent — tasks"
            lines={[
              { kind: 'prompt', text: 'agent> add route limit + audit' },
              { kind: 'muted', text: 'writing task…' },
              { kind: 'ok', text: '✓ updated api limiter rules' },
              { kind: 'ok', text: '✓ added audit metadata' },
              { kind: 'warn', text: '△ running tests…' },
            ]}
          />

          <MiniTerminal
            className={styles.floatBottom}
            title="cli — submit"
            lines={[
              { kind: 'prompt', text: '~/proj $ nibras submit' },
              { kind: 'muted', text: 'staging allowed files…' },
              { kind: 'ok', text: '✓ pushed commit 3f1c9d2' },
              { kind: 'text', text: 'verifying ██████████░░ 78%' },
              { kind: 'ok', text: '✓ passed (score 94/100)' },
            ]}
          />

          <OrdersPanel className={styles.floatRight} />

          <StatCard
            className={styles.statA}
            label="Tokens"
            value="1.1M"
            sub="This week"
            trend="up"
          />
          <StatCard className={styles.statB} label="Latency" value="620ms" sub="p95" trend="down" />
          <StatCard className={styles.statC} label="Runs" value="428" sub="Today" trend="up" />
        </div>
      </div>
    </section>
  );
}
