import HomePage from './home-page';
import { getAuthProvidersConfig } from '@/lib/auth-providers-server';

export default function Page() {
  const initialProviders = getAuthProvidersConfig();
  return <HomePage initialProviders={initialProviders} />;
}
