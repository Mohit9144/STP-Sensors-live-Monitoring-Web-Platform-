import React, { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Settings,
  BarChart3,
  Droplets,
  Menu,
  Bell,
  Search,
  User,
  X,
  Orbit,
  Code,
  Database,
  Zap,
  Hexagon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, setActiveSection }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sensors', label: 'Sensors', icon: Droplets },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="p-6 relative z-10">
        <div className={cn("flex items-center gap-3 mb-10 relative", mobile && isMobileSidebarOpen && "sidebar-brand-pop")}>
          <div className="sidebar-logo-orbit" aria-hidden="true">
            <span className="logo-dot logo-dot-a" />
            <span className="logo-dot logo-dot-b" />
            <span className="logo-dot logo-dot-c" />
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-900/50 bg-gradient-to-br from-teal-400 to-teal-600 relative z-10">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <h1 className="text-base font-extrabold text-white leading-tight">STP Monitor</h1>
            <p className="text-[9px] font-bold text-teal-200 uppercase tracking-[0.2em]">Enterprise</p>
          </div>
          {mobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="ml-auto p-2 rounded-lg border border-teal-700 text-teal-100/70 hover:text-white bg-teal-800 hover:bg-teal-700"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className={cn("space-y-1.5", mobile && "sidebar-nav-stagger", mobile && isMobileSidebarOpen && "sidebar-nav-open")}>
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setIsMobileSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                mobile && "sidebar-nav-item",
                activeSection === item.id
                  ? "bg-teal-800 text-white shadow-sm border border-teal-700"
                  : "text-teal-100/70 hover:bg-teal-800/50 hover:text-white"
              )}
              style={mobile ? { animationDelay: `${index * 70}ms` } : undefined}
            >
              <item.icon className={cn("w-4.5 h-4.5", activeSection === item.id ? "text-teal-300" : "text-teal-200/50")} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 relative z-10">
        <div className="rounded-2xl p-4 text-white relative overflow-hidden shadow-xl shadow-teal-900/50 bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 border border-teal-700">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Orbit className="w-3.5 h-3.5 text-cyan-200 sidebar-orbit-ping" />
              <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">System Status</p>
            </div>
            <p className="text-xs font-bold mb-3">All systems operational</p>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-accent h-full w-[94%] sidebar-progress-flow" />
            </div>
          </div>
          <Activity className="absolute -right-4 -bottom-4 w-20 h-20 opacity-10" />
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-transparent flex overflow-hidden">
      {isMobileSidebarOpen && (
        <button
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[280px] max-w-[82vw] bg-teal-900 text-white border-r border-teal-800 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden relative overflow-hidden",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarNanoTechBackdrop />
        <SidebarContent mobile />
      </aside>

      {/* Sidebar */}
      <aside className="w-64 bg-teal-900 text-white border-r border-teal-800 hidden lg:flex flex-col relative overflow-hidden">
        <SidebarNanoTechBackdrop />
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 glass-panel border-b border-slate-200/70 flex items-center justify-between px-3 sm:px-5 lg:px-8 sticky top-0 z-30 relative overflow-hidden gap-2 sm:gap-3">
          <div className="absolute inset-0 pointer-events-none opacity-78">
            <HeaderTechDiagram variant={0} className="w-full h-full text-blue-900/45" />
          </div>
          <div className="absolute right-0 top-0 h-full w-[58%] pointer-events-none opacity-100">
            <div className="absolute inset-0 bg-gradient-to-l from-blue-900/24 via-blue-800/10 to-transparent" />
            <HeaderTechDiagram variant={0} className="w-full h-full text-blue-900/72" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 relative z-10">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-300 bg-white/90"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-xs w-full hidden md:block min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 relative z-10 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 bg-white text-emerald-600 rounded-full border border-emerald-200 shadow-sm">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">Live</span>
            </div>
            
            <button className="p-2 text-slate-500 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-300 shadow-sm transition-all relative active:scale-[0.97]">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            
            <div className="h-6 w-[1px] bg-slate-200 mx-0.5 sm:mx-1" />
            
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-black">John Doe</p>
                <p className="text-[9px] font-bold text-black uppercase">Admin</p>
              </div>
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 border border-slate-300 shadow-sm">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

const Activity = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const SidebarNanoTechBackdrop = () => (
  <div className="sidebar-tech-bg" aria-hidden="true">
    <Code className="tech-glyph glyph-1" />
    <Database className="tech-glyph glyph-2" />
    <Zap className="tech-glyph glyph-3" />
    <Hexagon className="tech-glyph glyph-4" />
    <div className="tech-chip chip-1" />
    <div className="tech-chip chip-2" />
    <div className="tech-chip chip-3" />
    <div className="tech-chip chip-4" />
  </div>
);

const HeaderTechDiagram = ({ className, variant }: { className?: string; variant: 0 | 1 | 2 }) => (
  <svg className={className} viewBox="0 0 1200 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="techLine" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0" />
        <stop offset="0.2" stopColor="currentColor" stopOpacity="0.8" />
        <stop offset="0.8" stopColor="currentColor" stopOpacity="0.8" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
    </defs>

    {variant === 0 && (
      <>
        <path className="tech-wire" d="M0 18H140V34H260V16H420V30H540V14H700V32H860V18H1010V36H1200" stroke="url(#techLine)" strokeWidth="1.2" />
        <path className="tech-wire-secondary" d="M0 46H190V28H330V44H480V26H650V42H820V24H980V40H1200" stroke="url(#techLine)" strokeWidth="1" />
        <path className="tech-sweep" d="M0 18H140V34H260V16H420V30H540V14H700V32H860V18H1010V36H1200" stroke="currentColor" strokeWidth="2" />

        <circle className="tech-node" cx="140" cy="34" r="2.6" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="330" cy="44" r="2.6" fill="currentColor" />
        <circle className="tech-node" cx="540" cy="14" r="2.6" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="700" cy="32" r="2.6" fill="currentColor" />
        <circle className="tech-node" cx="980" cy="40" r="2.6" fill="currentColor" />

        <rect x="230" y="11" width="26" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect x="458" y="39" width="26" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect x="788" y="11" width="26" height="10" rx="2" stroke="currentColor" strokeWidth="1" />

        <path d="M230 21V34" stroke="currentColor" strokeWidth="1" opacity="0.8" />
        <path d="M471 39V26" stroke="currentColor" strokeWidth="1" opacity="0.8" />
        <path d="M801 21V24" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      </>
    )}

    {variant === 1 && (
      <>
        <path className="tech-wire" d="M0 30H180L220 16H360L390 30H560L590 14H740L790 30H960L1000 18H1200" stroke="url(#techLine)" strokeWidth="1.2" />
        <path className="tech-wire-secondary" d="M0 50H130L170 36H320L350 50H520L560 34H760L800 50H1030L1060 38H1200" stroke="url(#techLine)" strokeWidth="1" />
        <path className="tech-sweep" d="M0 30H180L220 16H360L390 30H560L590 14H740L790 30H960L1000 18H1200" stroke="currentColor" strokeWidth="2" />

        <circle className="tech-node" cx="220" cy="16" r="2.8" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="390" cy="30" r="2.8" fill="currentColor" />
        <circle className="tech-node" cx="590" cy="14" r="2.8" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="800" cy="50" r="2.8" fill="currentColor" />
        <circle className="tech-node" cx="1060" cy="38" r="2.8" fill="currentColor" />

        <rect x="275" y="10" width="22" height="9" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect x="655" y="8" width="22" height="9" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect x="915" y="24" width="22" height="9" rx="2" stroke="currentColor" strokeWidth="1" />
      </>
    )}

    {variant === 2 && (
      <>
        <path className="tech-wire" d="M0 14H120V28H240V44H360V26H520V46H680V24H860V42H1040V20H1200" stroke="url(#techLine)" strokeWidth="1.2" />
        <path className="tech-wire-secondary" d="M0 40H140V22H280V38H440V18H620V36H800V16H990V34H1200" stroke="url(#techLine)" strokeWidth="1" />
        <path className="tech-sweep" d="M0 14H120V28H240V44H360V26H520V46H680V24H860V42H1040V20H1200" stroke="currentColor" strokeWidth="2" />

        <circle className="tech-node" cx="240" cy="44" r="2.4" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="520" cy="46" r="2.4" fill="currentColor" />
        <circle className="tech-node" cx="860" cy="42" r="2.4" fill="currentColor" />
        <circle className="tech-node tech-node-delay" cx="1040" cy="20" r="2.4" fill="currentColor" />

        <rect x="330" y="21" width="30" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
        <rect x="730" y="19" width="30" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
        <path d="M345 31V44" stroke="currentColor" strokeWidth="1" opacity="0.8" />
        <path d="M745 29V16" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      </>
    )}
  </svg>
);
