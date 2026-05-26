import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, FolderKanban, BarChart3, Repeat, CalendarDays, Inbox, MoreHorizontal, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const allNavItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Tarefas', path: '/tasks', icon: CheckSquare },
  { title: 'Inbox', path: '/inbox', icon: Inbox },
  { title: 'Calendário', path: '/calendar', icon: CalendarDays },
  { title: 'Recorrências', path: '/recurrences', icon: Repeat },
  { title: 'Projetos', path: '/projects', icon: FolderKanban },
  { title: 'Produtividade', path: '/productivity', icon: BarChart3 },
];

const bottomPrimary = allNavItems.slice(0, 4); // Dashboard, Tarefas, Inbox, Calendário
const bottomOverflow = allNavItems.slice(4);   // Recorrências, Projetos, Produtividade

export default function AppSidebar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* ── Desktop sidebar (md+) ───────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[220px] flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2 p-5 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <CheckSquare className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight">TaskFlow</h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
        {/* User / logout */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary uppercase">
                {user?.email?.[0] ?? '?'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomPrimary.map((item) => {
            const isActive = pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1"
              >
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-medium truncate transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn("flex flex-col items-center gap-0.5 px-3 py-2 min-w-0 flex-1",
              bottomOverflow.some(i => i.path === pathname) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "Mais" overlay ────────────────────────────── */}
      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-4 space-y-1 safe-bottom">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-foreground">Mais</span>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {bottomOverflow.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary uppercase">{user?.email?.[0] ?? '?'}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => { setMoreOpen(false); signOut(); }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium w-full text-muted-foreground hover:bg-secondary transition-all"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
