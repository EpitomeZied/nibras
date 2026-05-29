import { mockupStatCards } from '../_content/landing';
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

function DashboardPanel({ className }: { className?: string }) {
  const [deadlines, reputation, practice] = mockupStatCards;

  return (
    <div className={`${styles.panel} ${styles.orders} ${className ?? ''}`}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Dashboard</span>
        <span className={styles.pill}>This term</span>
      </div>
      <div className={styles.ordersBody}>
        <div className={styles.ordersGrid}>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>{deadlines.label}</div>
            <div className={styles.ordersKpiValue}>{deadlines.value}</div>
            <div className={styles.ordersKpiSub}>{deadlines.sub}</div>
          </div>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>{reputation.label}</div>
            <div className={styles.ordersKpiValue}>{reputation.value}</div>
            <div className={styles.ordersKpiSub}>{reputation.sub}</div>
          </div>
          <div className={styles.ordersKpi}>
            <div className={styles.ordersKpiLabel}>{practice.label}</div>
            <div className={styles.ordersKpiValue}>{practice.value}</div>
            <div className={styles.ordersKpiSub}>{practice.sub}</div>
          </div>
        </div>
        <div className={styles.ordersChart}>
          <div className={styles.chartHeader}>
            <span className={styles.chartLabel}>Course activity</span>
            <span className={styles.chartLegend}>
              <span className={styles.legendDot} />
              Submissions
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
    <section className={styles.section} aria-label="Nibras platform preview">
      <div className={styles.sectionInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>One platform for CS programs</p>
          <h2 className={styles.title}>
            <span className={styles.titleBright}>Courses, projects, and CLI</span>
            <span className={styles.titleItalic}>without the tab chaos.</span>
          </h2>
          <p className={styles.sub}>
            My Courses, team projects, Hassona tutoring, competitive practice, and GitHub-native
            submissions — connected on one dashboard instead of scattered LMS tabs and side tools.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryCta} href="/sign-in">
              Get started free
            </a>
            <a className={styles.secondaryCta} href="#features">
              Explore features →
            </a>
          </div>
        </div>

        <div
          className={styles.canvas}
          role="img"
          aria-label="Nibras dashboard, CLI submit, and course activity preview"
        >
          <div className={styles.glow} aria-hidden="true" />

          <MiniTerminal
            className={styles.floatLeft}
            title="dashboard — today"
            lines={[
              { kind: 'prompt', text: 'nibras> deadlines --week' },
              { kind: 'muted', text: '3 due · 2 submissions pending review' },
              { kind: 'ok', text: '✓ HW2 — Sorting submitted' },
              { kind: 'ok', text: '✓ Nibras 75 — Two Sum accepted' },
              { kind: 'warn', text: '△ Capstone milestone due Sun' },
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

          <DashboardPanel className={styles.floatRight} />

          <StatCard
            className={styles.statA}
            label="Badges"
            value="8"
            sub="Earned this term"
            trend="up"
          />
          <StatCard className={styles.statB} label="Q&A" value="12" sub="Answers given" trend="up" />
          <StatCard
            className={styles.statC}
            label="Submissions"
            value="24"
            sub="This semester"
            trend="up"
          />
        </div>
      </div>
    </section>
  );
}
