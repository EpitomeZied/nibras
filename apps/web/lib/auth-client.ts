'use client';

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';
import { polarClient } from '@polar-sh/better-auth/client';

const plugins = [
  magicLinkClient(),
  ...(process.env.NEXT_PUBLIC_POLAR_ENABLED === 'true' ? [polarClient()] : []),
];

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL ?? 'http://127.0.0.1:3000'),
  plugins,
});
