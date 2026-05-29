import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins';
import { checkout, polar, portal, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { prisma } from './prisma';
import { sendMagicLinkEmail, sendWelcomeEmail } from './email';
import { allocateUniqueUsername, deriveUsernameBase } from './auth-user-helpers';
import { githubOAuthGetUserInfo } from './github-oauth-user';

function authBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL ??
    process.env.NIBRAS_WEB_BASE_URL ??
    'http://127.0.0.1:3000'
  );
}

function trustedOrigins(): string[] {
  return [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL,
    process.env.NIBRAS_WEB_BASE_URL,
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ].filter((v): v is string => Boolean(v));
}

const githubClientId = process.env.GITHUB_APP_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};
  if (githubClientId && githubClientSecret) {
    providers.github = {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      scope: ['read:user', 'user:email'],
      getUserInfo: githubOAuthGetUserInfo,
    };
  }
  return providers;
}

const socialProviders = buildSocialProviders();

const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const polarClient = polarAccessToken
  ? new Polar({
      accessToken: polarAccessToken,
      server: process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox',
    })
  : null;

const polarProductId = process.env.POLAR_PRODUCT_PRO_ID;
const polarProductSlug = process.env.POLAR_PRODUCT_SLUG ?? 'pro';

const polarUse = polarClient
  ? [
      checkout({
        products: polarProductId ? [{ productId: polarProductId, slug: polarProductSlug }] : [],
        successUrl: '/dashboard?checkout_id={CHECKOUT_ID}',
        authenticatedUsersOnly: true,
      }),
      portal(),
      ...(process.env.POLAR_WEBHOOK_SECRET
        ? [
            webhooks({
              secret: process.env.POLAR_WEBHOOK_SECRET,
              onOrderPaid: async () => {},
            }),
          ]
        : []),
    ]
  : [];

const polarPlugins =
  polarClient && polarAccessToken
    ? [
        polar({
          client: polarClient,
          createCustomerOnSignUp: true,
          // Polar plugin tuple typing is strict; runtime list is valid for our scaffold.
          use: polarUse as [ReturnType<typeof checkout>, ReturnType<typeof portal>],
        }),
      ]
    : [];

export const auth = betterAuth({
  appName: 'Nibras',
  baseURL: authBaseUrl(),
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NODE_ENV === 'production' ? undefined : 'nibras-dev-better-auth-secret'),
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins: trustedOrigins(),
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  user: {
    modelName: 'User',
    fields: {
      name: 'displayName',
      email: 'email',
      emailVerified: 'emailVerified',
      image: 'image',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    additionalFields: {
      username: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  session: {
    modelName: 'AuthSession',
  },
  account: {
    modelName: 'AuthAccount',
    accountLinking: {
      enabled: true,
      trustedProviders: ['github'],
    },
  },
  verification: {
    modelName: 'AuthVerification',
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  plugins: [
    magicLink({
      expiresIn: 300,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
    }),
    ...polarPlugins,
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = String(user.email ?? '');
          const base = deriveUsernameBase(
            typeof user.displayName === 'string'
              ? user.displayName
              : typeof user.name === 'string'
                ? user.name
                : null,
            email
          );
          const username = await allocateUniqueUsername(base);
          return {
            data: {
              ...user,
              username,
              displayName:
                (typeof user.displayName === 'string' && user.displayName) ||
                (typeof user.name === 'string' && user.name) ||
                base,
            },
          };
        },
        after: async (user) => {
          const email = String(user.email ?? '');
          const name =
            (typeof user.displayName === 'string' && user.displayName) ||
            (typeof user.name === 'string' && user.name) ||
            email.split('@')[0] ||
            'there';
          try {
            await sendWelcomeEmail({ email, name });
          } catch (err) {
            console.error('[auth] welcome email failed (user was created):', err);
          }
        },
      },
    },
  },
});
