'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Network, LayoutDashboard, FolderOpen,
  LogOut, Menu, X, ChevronLeft, ChevronDown, User, Settings,
  FileSpreadsheet, Package, Bell, TrendingUp, HardHat, BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] };
type NavEntry = NavItem | (NavGroup & { group: true });

const nav: NavEntry[] = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/proyectos',  label: 'Proyectos', icon: FolderOpen },
  { href: '/tecnicos',   label: 'Técnicos',   icon: HardHat },
  { href: '/inventario', label: 'Inventario', icon: Package },
  {
    group: true, label: 'Reportes', icon: BarChart2,
    items: [
      { href: '/reportes', label: 'Reportes 607', icon: FileSpreadsheet },
      { href: '/roi',      label: 'ROI Analysis', icon: TrendingUp },
    ],
  },
  {
    group: true, label: 'Configuración', icon: Settings,
    items: [
      { href: '/alertas',       label: 'Alertas',        icon: Bell },
      { href: '/configuracion', label: 'Configuración',  icon: Settings },
    ],
  },
];

function isGroup(e: NavEntry): e is NavGroup & { group: true } {
  return (e as any).group === true;
}

export default function AppSidebar({ user, empresa }: { user: any; empresa?: { nombre: string | null; logo: string | null } | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  // Auto-expand group if current path is inside it
  const defaultOpen = (items: NavItem[]) => items.some(i => pathname === i.href || pathname?.startsWith(i.href + '/'));
  const [openGroups, setOpenGroups]   = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    nav.forEach(e => { if (isGroup(e) && defaultOpen(e.items)) init[e.label] = true; });
    return init;
  });

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  const linkClass = (active: boolean) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

  const subLinkClass = (active: boolean) => cn(
    'flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-lg text-sm transition-colors',
    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-md rounded-lg p-2 hover:bg-muted"
      >
        <Menu className="w-5 h-5" />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen bg-white border-r border-border flex flex-col transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          {empresa?.logo ? (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={empresa.logo} alt={empresa?.nombre ?? 'Logo'} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-display font-bold tracking-tight leading-tight truncate">
                {empresa?.nombre ?? 'RedCalc'}
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {empresa?.nombre ? 'RedCalc · Materiales para Redes' : 'Materiales para Redes'}
              </p>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="ml-auto text-muted-foreground hover:text-foreground hidden lg:block">
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map((entry) => {
            if (!isGroup(entry)) {
              const Icon = entry.icon;
              const active = pathname === entry.href || pathname?.startsWith(entry.href + '/');
              return (
                <Link key={entry.href} href={entry.href} onClick={() => setMobileOpen(false)}
                  className={linkClass(active)}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="truncate">{entry.label}</span>}
                </Link>
              );
            }

            // Group
            const Icon = entry.icon;
            const open = !!openGroups[entry.label];
            const anyActive = entry.items.some(i => pathname === i.href || pathname?.startsWith(i.href + '/'));

            return (
              <div key={entry.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(entry.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    anyActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{entry.label}</span>
                      <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180')} />
                    </>
                  )}
                </button>
                {!collapsed && open && (
                  <div className="mt-0.5 space-y-0.5">
                    {entry.items.map((sub) => {
                      const SubIcon = sub.icon;
                      const active = pathname === sub.href || pathname?.startsWith(sub.href + '/');
                      return (
                        <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)}
                          className={subLinkClass(active)}>
                          <SubIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 shrink-0">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name ?? 'Usuario'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn('w-full mt-2 text-muted-foreground hover:text-destructive', collapsed && 'px-0')}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
