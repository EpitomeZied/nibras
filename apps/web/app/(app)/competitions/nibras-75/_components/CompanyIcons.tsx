import styles from '../page.module.css';

export type CompanyDto = {
  id: string;
  name: string;
  domain: string;
  iconUrl: string;
};

type CompanyIconsProps = {
  companies: CompanyDto[];
  askedByCount: number;
};

export default function CompanyIcons({ companies, askedByCount }: CompanyIconsProps) {
  const visible = companies.slice(0, 6);
  const extra = Math.max(0, askedByCount - visible.length);

  return (
    <div className={styles.companyRow} aria-label={`Asked by ${askedByCount} companies`}>
      <span className={styles.askedByLabel}>Asked by</span>
      <div className={styles.companyIcons}>
        {visible.map((c) => (
          <span key={c.id} className={styles.companyIconWrap} title={c.name}>
            <img
              src={c.iconUrl}
              alt=""
              width={20}
              height={20}
              className={styles.companyIcon}
              loading="lazy"
            />
          </span>
        ))}
        {extra > 0 && <span className={styles.companyMore}>+{extra}</span>}
      </div>
    </div>
  );
}
