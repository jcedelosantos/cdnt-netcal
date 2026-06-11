import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppSidebar from './_components/app-sidebar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = (session?.user as any)?.id;
  let empresa: { nombre: string | null; logo: string | null } | null = null;
  if (userId) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { empresaNombre: true, empresaLogo: true },
      });
      empresa = { nombre: u?.empresaNombre ?? null, logo: u?.empresaLogo ?? null };
    } catch { /* sin empresa configurada */ }
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar user={session?.user} empresa={empresa} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
