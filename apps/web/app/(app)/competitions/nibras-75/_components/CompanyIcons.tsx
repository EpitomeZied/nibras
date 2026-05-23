'use client';

import { useState } from 'react';
import styles from '../page.module.css';

export type CompanyDto = {
  id: string;
  name: string;
  domain: string;
  iconUrl: string;
};

type CompanyIconsProps = {
  companies: CompanyDto[];
};

function logoSrc(company: CompanyDto): string {
  return `/companies/${company.id}.svg`;
}

function CompanyLogo({ company }: { company: CompanyDto }) {
  const [failed, setFailed] = useState(false);
  const initial = company.name.charAt(0).toUpperCase();

  if (failed) {
    return (
      <span className={styles.companyFallback} aria-hidden>
        {initial}
      </span>
    );
  }

  return (
    <img
      src={logoSrc(company)}
      alt={company.name}
      width={20}
      height={20}
      className={styles.companyIcon}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function CompanyIcons({ companies }: CompanyIconsProps) {
  const visible = companies.slice(0, 6);

  return (
    <div className={styles.companyRow}>
      <span className={styles.askedByLabel}>Asked by</span>
      <div className={styles.companyIcons}>
        {visible.map((c) => (
          <span
            key={c.id}
            className={styles.companyIconWrap}
            data-company={c.id}
            title={c.name}
          >
            <CompanyLogo company={c} />
          </span>
        ))}
      </div>
    </div>
  );
}
