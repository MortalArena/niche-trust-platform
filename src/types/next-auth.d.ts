import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      walletAddress?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    walletAddress?: string;
  }
}
