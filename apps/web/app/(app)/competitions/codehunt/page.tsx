import { redirect } from 'next/navigation';

export default function CodehuntRedirectPage() {
  redirect('/competitions/practice?tab=codeforces');
}
