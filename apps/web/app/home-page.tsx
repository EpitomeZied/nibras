'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NibrasLogo from './_components/nibras-logo';
import AuthSignIn from './_components/auth-sign-in';
import type { AuthProvidersConfig } from '@/lib/auth-providers-server';
import AgentMissionControlSection from './_components/agent-mission-control';
import FeatureTilesShowcase from './_components/feature-tiles-showcase';
import {
  cliFeatures,
  ctaFeatures,
  landingFooterContactEmail,
  landingNavLinks,
  heroBadge,
  heroSub,
  howItWorksSteps,
  statsBar,
  supportNotice,
  transformGains,
  transformPains,
  transformSub,
  whatsNew,
} from './_content/landing';
import { WEB_BASE_URL } from './lib/web-base-url';
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

function LandingNavAnchor({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

type HomePageProps = {
  initialProviders: AuthProvidersConfig;
};

export default function HomePage({ initialProviders }: HomePageProps) {
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
          <a href={WEB_BASE_URL} className={styles.siteLogoLink} aria-label="nibrasplatform.me">
            <NibrasLogo variant="inverse" width={110} priority />
          </a>
          <span className={styles.navBadge}>Beta</span>
        </div>
        <div className={styles.navLinks}>
          {landingNavLinks.map((link) => (
            <LandingNavAnchor
              key={link.href}
              href={link.href}
              label={link.label}
              className={styles.navLinkSub}
            />
          ))}
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
          <Link href="/sign-in" className={styles.navSignIn}>
            Sign in
          </Link>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={`${styles.terminalWindow} ${styles.heroTerminal}`}>
          <div className={styles.terminalTitleBar}>
            <span className={styles.termDot} style={{ background: '#ff5f57' }} />
            <span className={styles.termDot} style={{ background: '#febc2e' }} />
            <span className={styles.termDot} style={{ background: '#28c840' }} />
            <span className={styles.termTitle}>nibras — welcome</span>
          </div>

          <div className={`${styles.terminalBody} ${styles.heroTerminalBody}`}>
            <div className={styles.termLine}>
              <span className={styles.termMuted}># </span>
              <span className={styles.heroTermBadge}>{heroBadge}</span>
            </div>

            <h1 className={styles.heroTerminalTitle}>
              <span className={styles.heroTerminalTitleLine}>Run your academic system</span>
              <span className={`${styles.heroTerminalTitleLine} ${styles.heroTerminalTitleAccent}`}>
                like a real operating platform.
              </span>
              <span className={`${styles.heroTerminalTitleLine} ${styles.heroTerminalTitleMuted}`}>
                Without the chaos.
              </span>
            </h1>

            <p className={styles.heroTermSub}>{heroSub}</p>

            <div className={styles.termLine}>
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> login</span>
            </div>

            <div className={styles.signInAuthPanel}>
              <AuthSignIn
                variant="terminal"
                initialProviders={initialProviders}
                githubClassName={styles.termAuthBtn}
                magicLinkClassName={styles.termAuthBtnGhost}
                emailInputClassName={styles.termEmailInput}
                errorClassName={styles.termAuthError}
                noticeClassName={styles.termAuthNotice}
                unavailableClassName={styles.signInUnavailable}
                githubLabel="Get started free with GitHub"
                magicLinkLabel="Email me a sign-in link"
              />
            </div>

            <div className={styles.termLine}>
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> whats-new</span>
            </div>

            <ul className={styles.heroWhatsNew} aria-label="What's new">
              {whatsNew.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.heroWhatsNewLinkWrap}>
              <Link href="/changelog" className={styles.whatsNewLink}>
                View full changelog →
              </Link>
            </p>

            <a href="#how-it-works" className={styles.heroTermHelpLink}>
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> help --how-it-works</span>
            </a>
          </div>
        </div>
      </div>

      <AgentMissionControlSection />

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

      <section id="how-it-works" className={`${styles.section} ${styles.howItWorksSection}`}>
        <div className={`${styles.terminalWindow} ${styles.howItWorksTerminal}`}>
          <div className={styles.terminalTitleBar}>
            <span className={styles.termDot} style={{ background: '#ff5f57' }} />
            <span className={styles.termDot} style={{ background: '#febc2e' }} />
            <span className={styles.termDot} style={{ background: '#28c840' }} />
            <span className={styles.termTitle}>nibras — how-it-works</span>
          </div>

          <div className={`${styles.terminalBody} ${styles.howItWorksBody}`}>
            <div className={styles.termLine}>
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> man how-it-works</span>
            </div>

            <p className={styles.howItWorksIntro}>
              From sign-in to submission in three steps. One GitHub login connects your identity,
              workspace, and delivery history — no setup friction.
            </p>

            <div className={styles.howItWorksSteps} role="list">
              {howItWorksSteps.map((step) => (
                <article key={step.step} className={styles.howItWorksStep} role="listitem">
                  <div className={styles.termLine}>
                    <span className={styles.termMuted}>[{step.step}] </span>
                    <span className={styles.termSuccess}>{step.title}</span>
                  </div>
                  <p className={styles.howItWorksStepDesc}>{step.desc}</p>
                  {step.cta && step.href ? (
                    <Link href={step.href} className={styles.howItWorksStepLink}>
                      <span className={styles.termMuted}>→ </span>
                      <span className={styles.termCmd}>{step.cta}</span>
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>

            <div className={styles.termLine}>
              <span className={styles.termMuted}>3 steps · </span>
              <span className={styles.termHighlight}>ready to begin</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.diffSection}`}>
        <div className={`${styles.terminalWindow} ${styles.diffTerminal}`}>
          <div className={styles.terminalTitleBar}>
            <span className={styles.termDot} style={{ background: '#ff5f57' }} />
            <span className={styles.termDot} style={{ background: '#febc2e' }} />
            <span className={styles.termDot} style={{ background: '#28c840' }} />
            <span className={styles.termTitle}>nibras — diff</span>
          </div>

          <div className={`${styles.terminalBody} ${styles.diffBody}`}>
            <div className={styles.termLine}>
              <span className={styles.termPrompt}>nibras</span>
              <span className={styles.termCmd}> diff before after</span>
            </div>

            <p className={styles.diffIntro}>
              From scattered academic operations to one clean system. {transformSub}
            </p>

            <div className={styles.diffColumns}>
              <div className={styles.diffPane}>
                <div className={styles.termLine}>
                  <span className={styles.termFail}>--- before ---</span>
                </div>
                <ul className={styles.diffList}>
                  {transformPains.map((pain) => (
                    <li key={pain} className={styles.diffListItem}>
                      <span className={styles.termFail} aria-hidden="true">
                        ✕{' '}
                      </span>
                      {pain}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.diffPane}>
                <div className={styles.termLine}>
                  <span className={styles.termSuccess}>+++ after +++</span>
                </div>
                <ul className={styles.diffList}>
                  {transformGains.map((gain) => (
                    <li key={gain} className={styles.diffListItem}>
                      <span className={styles.termSuccess} aria-hidden="true">
                        ✓{' '}
                      </span>
                      {gain}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeatureTilesShowcase />

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
        <div className={styles.supportCard}>
          <span className={styles.sectionEyebrow}>{supportNotice.eyebrow}</span>
          <p className={styles.supportBody}>{supportNotice.body}</p>
          <a className={styles.supportEmail} href={`mailto:${supportNotice.email}`}>
            {supportNotice.email}
          </a>
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

          <AuthSignIn
            initialProviders={initialProviders}
            githubClassName={styles.btnGitHub}
            magicLinkClassName={styles.btnMagicLink}
            emailInputClassName={styles.magicLinkEmail}
            errorClassName={styles.errorMsg}
            noticeClassName={styles.authNotice}
            unavailableClassName={styles.signInUnavailable}
            githubLabel="Continue with GitHub"
          />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandRow}>
              <a href={WEB_BASE_URL} className={styles.siteLogoLink} aria-label="nibrasplatform.me">
                <NibrasLogo variant="inverse" width={100} />
              </a>
            </div>
            <p className={styles.footerTagline}>
              The academic operations platform for serious instructors and students.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Product</span>
              {landingNavLinks.map((link) => (
                <LandingNavAnchor key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Developers</span>
              <Link href="/docs">Documentation</Link>
              <a href="/instructor/onboarding">CLI Setup Guide</a>
              <a href="https://github.com/nibras-platform/nibras" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Account</span>
              <Link href="/sign-in">Sign in</Link>
              <a href="/dashboard">Dashboard</a>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Contact</span>
              <a href={`mailto:${landingFooterContactEmail}`}>{landingFooterContactEmail}</a>
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
