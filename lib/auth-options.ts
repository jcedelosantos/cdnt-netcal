import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  // No adapter needed - using JWT strategy with Credentials provider
  // This avoids unnecessary DB calls on every session check,
  // preventing idle-session timeout issues
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error: any) {
          console.error('Auth error, retrying after reconnect:', error?.message);
          // Retry after reconnect - the Prisma middleware handles connection errors,
          // but authorize needs its own retry since middleware can't retry the full authorize flow
          try {
            await prisma.$disconnect();
            await new Promise((r) => setTimeout(r, 500));
            await prisma.$connect();
            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });
            if (!user) return null;
            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (!isValid) return null;
            return { id: user.id, email: user.email, name: user.name, role: user.role };
          } catch (retryError: any) {
            console.error('Auth retry also failed:', retryError?.message);
            return null;
          }
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar cada 24 horas
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user?.id;
        token.role = user?.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).id = token?.id;
        (session.user as any).role = token?.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
