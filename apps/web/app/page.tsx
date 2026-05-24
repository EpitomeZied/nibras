'use client';

import { Suspense, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { discoverApiBaseUrl } from './lib/session';
import NibrasLogo from './_components/nibras-logo';
import {
  cliFeatures,
  ctaFeatures,
  featureGroups,
  featureNavLinks,
  heroBadge,
  heroSub,
  howItWorksSteps,
  mockupSidebar,
  mockupStatCards,
  mockupTableRows,
  mockupUrl,
  statsBar,
  testimonials,
  transformGains,
  transformPains,
  transformSub,
} from './_content/landing';
import { LandingIcon } from './_content/landing-icons';
import styles from './signin.module.css';

function AuthBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('auth') !== 'required') return null;
  return (
    <div className={styles.authBanner} role="alert">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Authentication required. Please sign in to access the dashboard.
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className={styles.featureCard6}>
      <span className={styles.featureIcon}>{icon}</span>
      <strong>{title}</strong>
      <p>{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setError('');
    setSubmitting(true);
    try {
      const apiBaseUrl = await discoverApiBaseUrl();
      const configRes = await fetch(`${apiBaseUrl}/v1/github/config`);
      if (configRes.ok) {
        const config = (await configRes.json()) as { configured: boolean };
        if (!config.configured) {
          setError(
            'GitHub App is not configured. Set GITHUB_APP_ID, GITHUB_APP_CLIENT_ID, and related environment variables, then restart the API.'
          );
          setSubmitting(false);
          return;
        }
      }
      const returnTo = `${window.location.origin}/auth/complete`;
      window.location.href = `${apiBaseUrl}/v1/github/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <Suspense>
        <AuthBanner />
      </Suspense>

      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
      <div className={styles.grid} />

      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <NibrasLogo variant="inverse" width={110} priority />
          <span className={styles.navBadge}>Beta</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          {featureNavLinks.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLinkSub}>
              {link.label}
            </a>
          ))}
          <a href="#how-it-works" className={styles.navLink}>
            How it works
          </a>
          <a href="#cli" className={styles.navLink}>
            CLI
          </a>
          <a
            href="https://github.com/EpitomeZied/nibras"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navStar}
            aria-label="Star Nibras on GitHub"
            title="Star on GitHub"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" />
            </svg>
            Star
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className={styles.navStarIcon}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </a>
          <button
            className={styles.navSignIn}
            onClick={() => void handleSignIn()}
            disabled={submitting}
          >
            {submitting ? 'Connecting…' : 'Sign in'}
          </button>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          {heroBadge}
        </div>

        <h1 className={styles.headline}>
          <span className={styles.headlineBright}>Run your academic system</span>
          <span className={styles.headlineGrad}>like a real operating platform.</span>
          <span className={styles.headlineMuted}>Without the chaos.</span>
        </h1>

        <p className={styles.sub}>{heroSub}</p>

        <div className={styles.heroCtas}>
          <button
            className={styles.btnHeroPrimary}
            onClick={() => void handleSignIn()}
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {submitting ? 'Connecting…' : 'Get started free'}
          </button>
          <a href="#how-it-works" className={styles.btnHeroGhost}>
            See how it works →
          </a>
        </div>
      </div>

      <div className={styles.productMockupWrap}>
        <div className={styles.productMockup}>
          <div className={styles.mockupBar}>
            <span className={styles.mockupDot} style={{ background: '#ff5f57' }} />
            <span className={styles.mockupDot} style={{ background: '#febc2e' }} />
            <span className={styles.mockupDot} style={{ background: '#28c840' }} />
            <span className={styles.mockupUrl}>{mockupUrl}</span>
          </div>

          <div className={styles.mockupBody}>
            <div className={styles.mockupSidebar}>
              {mockupSidebar.map((item) => (
                <div
                  key={item.label}
                  className={`${styles.mockupSidebarItem}${item.active ? ` ${styles.active}` : ''}`}
                >
                  <span className={styles.mockupSidebarDot} />
                  {item.label}
                </div>
              ))}
            </div>

            <div className={styles.mockupContent}>
              <div className={styles.mockupHeader}>
                <h3 className={styles.mockupTitle}>Applied Systems — Workflow Overview</h3>
                <span className={styles.mockupBadge}>Live</span>
              </div>

              <div className={styles.mockupCards}>
                {mockupStatCards.map((card) => (
                  <div key={card.label} className={styles.mockupCard}>
                    <span className={styles.mockupCardLabel}>{card.label}</span>
                    <span className={styles.mockupCardValue}>{card.value}</span>
                    <span className={styles.mockupCardSub}>{card.sub}</span>
                  </div>
                ))}
              </div>

              <div className={styles.mockupTable}>
                <div className={`${styles.mockupTableRow} ${styles.head}`}>
                  <span>Workflow</span>
                  <span>Surface</span>
                  <span>Status</span>
                  <span>State</span>
                </div>
                {mockupTableRows.map((row) => (
                  <div key={row.student} className={styles.mockupTableRow}>
                    <span style={{ color: '#fafafa', fontWeight: 600 }}>{row.student}</span>
                    <span style={{ color: 'rgba(161,161,170,0.6)', fontSize: '12px' }}>
                      {row.project}
                    </span>
                    <span
                      className={`${styles.mockupStatus} ${styles[row.status as keyof typeof styles]}`}
                    >
                      <svg
                        width="6"
                        height="6"
                        viewBox="0 0 6 6"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="3" cy="3" r="3" />
                      </svg>
                      {row.status}
                    </span>
                    <span style={{ color: 'rgba(161,161,170,0.7)', fontSize: '12px' }}>
                      {row.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.trustedBar}>
        Trusted by instructors and students running courses, teams, planning, and practice in one
        system
      </p>

      <div className={styles.statsBar}>
        {statsBar.map((stat, index) => (
          <div key={stat.label} className={styles.statItemWrap}>
            {index > 0 && <div className={styles.statDivider} />}
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stat.number}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>How it works</span>
          <h2 className={styles.sectionTitle}>
            From blueprint setup to active academic operations
          </h2>
          <p className={styles.sectionSub}>
            Three simple steps from blank slate to templates, team projects, Hassona support, and
            GitHub-tracked delivery.
          </p>
        </div>

        <div className={styles.timeline}>
          {howItWorksSteps.map((step) => (
            <div key={step.step} className={styles.timelineStep}>
              <div className={styles.timelineNumber}>{step.step}</div>
              <div className={styles.timelineContent}>
                <LandingIcon id={step.icon} size="timeline" />
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {step.cta && step.href && (
                  <Link href={step.href} className={styles.timelineCta}>
                    {step.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.transformSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>The Nibras Difference</span>
          <h2 className={styles.sectionTitle}>
            From scattered academic operations to one clean system
          </h2>
          <p className={styles.sectionSub}>{transformSub}</p>
        </div>

        <div className={styles.transformGrid}>
          <div className={styles.transformPanel}>
            <div className={`${styles.transformPanelHeader} ${styles.before}`}>
              <span className={`${styles.transformPanelDot} ${styles.before}`} />
              Before Nibras
            </div>
            <div className={styles.transformPanelBody}>
              {transformPains.map((pain) => (
                <div key={pain} className={styles.transformPainPoint}>
                  <span className={styles.transformPainIcon}>✕</span>
                  <span className={styles.transformPainText}>{pain}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.transformArrow}>→</div>

          <div className={styles.transformPanel}>
            <div className={`${styles.transformPanelHeader} ${styles.after}`}>
              <span className={`${styles.transformPanelDot} ${styles.after}`} />
              After Nibras
            </div>
            <div className={styles.transformPanelBody}>
              {transformGains.map((gain) => (
                <div key={gain} className={styles.transformGainPoint}>
                  <span className={styles.transformGainIcon}>✓</span>
                  <span className={styles.transformGainText}>{gain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Features</span>
          <h2 className={styles.sectionTitle}>
            Everything you need to run a modern academic system
          </h2>
          <p className={styles.sectionSub}>
            From templates and team formation to program planning, tutoring, community,
            competitions, IDE practice, achievements, and analytics — Nibras turns scattered
            tools and manual work into one clean operating layer.
          </p>
        </div>

        <div className={styles.featureGroups}>
          {featureGroups.map((group) => (
            <div key={group.id} id={group.id} className={styles.featureGroup}>
              <h3 className={styles.featureGroupLabel}>{group.label}</h3>
              <div className={styles.featureGrid}>
                {group.features.map((f) => (
                  <FeatureCard
                    key={f.title}
                    icon={<LandingIcon id={f.icon} />}
                    title={f.title}
                    desc={f.desc}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="cli" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>CLI</span>
          <h2 className={styles.sectionTitle}>
            A developer workflow that still fits the full system
          </h2>
          <p className={styles.sectionSub}>
            Nibras still gives students a clean submission CLI, but now it plugs into templates,
            team projects, the IDE, achievements, review queues, and academic planning instead of
            standing alone.
          </p>
        </div>

        <div className={styles.cliShowcase}>
          <div className={styles.terminalWindow}>
            <div className={styles.terminalTitleBar}>
              <span className={styles.termDot} style={{ background: '#ff5f57' }} />
              <span className={styles.termDot} style={{ background: '#febc2e' }} />
              <span className={styles.termDot} style={{ background: '#28c840' }} />
              <span className={styles.termTitle}>nibras — terminal</span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.termLine}>
                <span className={styles.termPrompt}>~/cs101/project-2</span>
                <span className={styles.termCmd}> $ nibras submit</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termSpinner} aria-hidden="true" />
                <span className={styles.termMuted}> Staging allowed files…</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termSuccess}>✓</span>
                <span className={styles.termMuted}> Staged </span>
                <span className={styles.termHighlight}>3 files</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termSuccess}>✓</span>
                <span className={styles.termMuted}> Pushed commit </span>
                <span className={styles.termHighlight}>a3f7c1d</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termProgress}> Verifying </span>
                <span className={styles.termBar}>██████████████░░░░░░</span>
                <span className={styles.termMuted}> 70%</span>
              </div>
              <div className={styles.termLine} style={{ marginTop: 8 }}>
                <span className={styles.termBoxTop}>╭──────────────────────────────────╮</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termBoxSide}>│</span>
                <span className={styles.termSuccess}> ✓ Submission passed </span>
                <span className={styles.termBoxSide}>│</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termBoxSide}>│</span>
                <span className={styles.termDimText}> Score: 94 / 100 </span>
                <span className={styles.termBoxSide}>│</span>
              </div>
              <div className={styles.termLine}>
                <span className={styles.termBoxBottom}>╰──────────────────────────────────╯</span>
              </div>
            </div>
          </div>

          <div className={styles.cliFeatures}>
            {cliFeatures.map((f) => (
              <div key={f.label} className={styles.cliFeat}>
                <span className={styles.cliFeatIcon}>{f.icon}</span>
                <div>
                  <strong>{f.label}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Instructor stories</span>
          <h2 className={styles.sectionTitle}>
            Less fragmentation. Better coordination. A system people can actually follow.
          </h2>
        </div>

        <div className={styles.testimonials}>
          {testimonials.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.testimonialAvatarInitials} aria-hidden="true">
                  {t.initials}
                </span>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>
            Ready to run courses, teams, and planning in one place?
          </h2>
          <p className={styles.ctaSub}>
            Sign in with GitHub, open the full Nibras system, and start using templates, team
            formation, planner workflows, Hassona, community, competitions, IDE, achievements,
            reputation, and GitHub-native submissions together.
          </p>

          <div className={styles.ctaFeatures}>
            {ctaFeatures.map((feat) => (
              <span key={feat} className={styles.ctaFeatureItem}>
                <span className={styles.ctaFeatureCheck}>✓</span>
                {feat}
              </span>
            ))}
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={styles.btnGitHub}
            type="button"
            onClick={() => void handleSignIn()}
            disabled={submitting}
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {submitting ? 'Connecting…' : 'Continue with GitHub'}
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandRow}>
              <NibrasLogo variant="inverse" width={100} />
            </div>
            <p className={styles.footerTagline}>
              The academic operations platform for serious instructors and students.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Product</span>
              <a href="#features">Features</a>
              {featureNavLinks.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <a href="#how-it-works">How it works</a>
              <a href="#cli">CLI</a>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Developers</span>
              <a href="/instructor/onboarding">CLI Setup Guide</a>
              <a
                href="https://github.com/nibras-platform/nibras"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Account</span>
              <button
                onClick={() => void handleSignIn()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                Sign in
              </button>
              <a href="/dashboard">Dashboard</a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>
            © {new Date().getFullYear()} nibrasplatform.me. Built by{' '}
            <a
              href="https://github.com/EpitomeZied"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerAuthorLink}
            >
              EpitomeZied
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
