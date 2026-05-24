import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { promoteAdminIfWallet } from '@/lib/admin/auth';
import { findOrCreateUserFromWallet } from '@/lib/wallets/service';
import type { ChainId } from '@/lib/chains/config';
import { getChain } from '@/lib/chains/config';

async function authorizeWallet(
  credentials: Record<string, unknown> | undefined,
  defaultChain: ChainId
) {
  const chain = (credentials?.chain as ChainId) ?? defaultChain;
  const address = credentials?.publicKey as string | undefined;
  const signature = credentials?.signature as string | undefined;
  const message = credentials?.message as string | undefined;

  if (!address || !signature || !message) return null;
  if (!getChain(chain)) return null;

  const user = await findOrCreateUserFromWallet({
    chain,
    address,
    message,
    signature,
  });

  if (!user) return null;

  await promoteAdminIfWallet(user.id, user.walletAddress ?? address);

  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name ?? user.displayName ?? undefined,
    image: user.image ?? undefined,
    walletAddress: user.walletAddress ?? address,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/connect',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? '',
    }),
    Credentials({
      id: 'solana',
      name: 'Solana',
      credentials: {
        publicKey: { label: 'Public Key', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
        chain: { label: 'Chain', type: 'text' },
      },
      authorize: (c) => authorizeWallet(c, 'solana'),
    }),
    Credentials({
      id: 'evm',
      name: 'EVM',
      credentials: {
        publicKey: { label: 'Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
        chain: { label: 'Chain', type: 'text' },
      },
      authorize: (c) => {
        const chain = (c?.chain as ChainId) ?? 'polygon';
        return authorizeWallet(c, chain);
      },
    }),
    Credentials({
      id: 'dev',
      name: 'Development',
      credentials: {},
      authorize: async () => {
        if (process.env.NODE_ENV === 'production') return null;

        const demoAddress = '0x0000000000000000000000000000000000000001';

        let user = await prisma.user.findFirst({
          where: { walletAddress: demoAddress },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { walletAddress: demoAddress, displayName: 'Demo Expert' },
          });
          await prisma.wallet.create({
            data: {
              userId: user.id,
              address: demoAddress,
              chain: 'polygon',
              isPrimary: true,
              label: 'Demo',
            },
          });
        }

        await promoteAdminIfWallet(user.id, demoAddress);

        return {
          id: user.id,
          walletAddress: demoAddress,
          name: user.displayName ?? 'Demo Expert',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = (user as { walletAddress?: string }).walletAddress;
      }
      // إضافة OAuth account info
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { walletAddress?: string }).walletAddress =
          token.walletAddress as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});