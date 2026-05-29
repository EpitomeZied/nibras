import type { UserProfileGamification } from '@nibras/contracts';
import styles from '../page.module.css';

export default function ProfileReputationTimeline({
  gamification,
}: {
  gamification: UserProfileGamification;
}) {
  const history = gamification.history ?? [];
  if (history.length === 0) return null;

  return (
    <section className={styles.section} id="profile-reputation">
      <h2 className={styles.sectionTitle}>Recent reputation</h2>
      <div className={styles.panel}>
        <ul className={styles.timelineList}>
          {history.map((event) => (
            <li key={event.id} className={styles.timelineRow}>
              <span className={event.delta >= 0 ? styles.repGain : styles.repLoss}>
                {event.delta >= 0 ? '+' : ''}
                {event.delta}
              </span>
              <div>
                <strong>{event.reason}</strong>
                {event.detail ? <div className={styles.progressMeta}>{event.detail}</div> : null}
              </div>
              <span className={styles.muted}>{new Date(event.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
