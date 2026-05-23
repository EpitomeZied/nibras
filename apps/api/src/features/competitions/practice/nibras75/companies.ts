export type CompanyId =
  | 'google'
  | 'meta'
  | 'amazon'
  | 'apple'
  | 'microsoft'
  | 'netflix'
  | 'uber'
  | 'bloomberg'
  | 'linkedin'
  | 'oracle'
  | 'adobe'
  | 'salesforce'
  | 'tiktok'
  | 'nvidia'
  | 'stripe';

export type CompanyInfo = {
  id: CompanyId;
  name: string;
  domain: string;
};

export const NIBRAS_75_COMPANIES: Record<CompanyId, CompanyInfo> = {
  google: { id: 'google', name: 'Google', domain: 'google.com' },
  meta: { id: 'meta', name: 'Meta', domain: 'meta.com' },
  amazon: { id: 'amazon', name: 'Amazon', domain: 'amazon.com' },
  apple: { id: 'apple', name: 'Apple', domain: 'apple.com' },
  microsoft: { id: 'microsoft', name: 'Microsoft', domain: 'microsoft.com' },
  netflix: { id: 'netflix', name: 'Netflix', domain: 'netflix.com' },
  uber: { id: 'uber', name: 'Uber', domain: 'uber.com' },
  bloomberg: { id: 'bloomberg', name: 'Bloomberg', domain: 'bloomberg.com' },
  linkedin: { id: 'linkedin', name: 'LinkedIn', domain: 'linkedin.com' },
  oracle: { id: 'oracle', name: 'Oracle', domain: 'oracle.com' },
  adobe: { id: 'adobe', name: 'Adobe', domain: 'adobe.com' },
  salesforce: { id: 'salesforce', name: 'Salesforce', domain: 'salesforce.com' },
  tiktok: { id: 'tiktok', name: 'TikTok', domain: 'tiktok.com' },
  nvidia: { id: 'nvidia', name: 'NVIDIA', domain: 'nvidia.com' },
  stripe: { id: 'stripe', name: 'Stripe', domain: 'stripe.com' },
};

const COMPANY_ORDER: CompanyId[] = [
  'google',
  'meta',
  'amazon',
  'apple',
  'microsoft',
  'netflix',
  'uber',
  'bloomberg',
  'linkedin',
  'oracle',
  'adobe',
  'salesforce',
  'tiktok',
  'nvidia',
  'stripe',
];

export function pickCompaniesForProblem(slug: string, askedByCount: number): CompanyInfo[] {
  const hash = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = Math.min(
    COMPANY_ORDER.length,
    Math.max(3, 3 + Math.floor(askedByCount / 12) + (hash % 3))
  );
  const start = hash % COMPANY_ORDER.length;
  const picked: CompanyInfo[] = [];
  for (let i = 0; i < count; i++) {
    const id = COMPANY_ORDER[(start + i) % COMPANY_ORDER.length];
    picked.push(NIBRAS_75_COMPANIES[id]);
  }
  return picked;
}

/** Static logos served from the web app (`public/companies/{id}.svg`). */
export function companyIconUrl(id: CompanyId): string {
  return `/companies/${id}.svg`;
}
