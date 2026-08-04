import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const DEPT_ACCENT = {
  'CSE':        { from: '#3730a3', to: '#6366f1' },
  'ECE':        { from: '#0e7490', to: '#22d3ee' },
  'Mechanical': { from: '#92400e', to: '#f59e0b' },
  'Civil':      { from: '#064e3b', to: '#10b981' },
  'MBA':        { from: '#4c1d95', to: '#a78bfa' },
};

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, theme, toggleTheme } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(() => {
    return ['/admin/hods', '/admin/incharges', '/admin/departments', '/admin/students', '/admin/remarks'].some(
      path => location.pathname.startsWith(path)
    );
  });

  const userName   = user?.name       || localStorage.getItem('userName')       || 'MIC Staff';
  const userRole   = user?.role       || localStorage.getItem('userRole')       || 'Staff';
  const userDept   = user?.department || localStorage.getItem('userDepartment') || '';
  const isIncharge = userRole?.toLowerCase() === 'incharge';
  const isHOD      = userRole?.toLowerCase() === 'hod';
  const isAdmin    = userRole?.toLowerCase() === 'admin';

  const deptAccent = isAdmin ? { from: '#0f766e', to: '#0d9488' } : (DEPT_ACCENT[userDept] || { from: '#1a1f4e', to: '#3d5af1' });

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Role-based navigation ──────────────────────────────────────────────────
  const NAV = [
    // Staff routes
    { path: '/home',           icon: 'space_dashboard', label: 'Dashboard',   roles: ['all'] },
    { path: '/registration',   icon: 'person_add',      label: 'Enrollment',  roles: ['incharge'] },
    { path: '/remark-scanner', icon: 'qr_code_scanner', label: 'Scanner',     roles: ['incharge'] },
    { path: '/remark',         icon: 'manage_search',   label: 'Search',      roles: ['incharge', 'hod'] },
    { path: '/history',        icon: 'monitoring',      label: 'History',     roles: ['all'] },

    // Admin routes
    { path: '/admin/dashboard',   icon: 'space_dashboard', label: 'Dashboard',            roles: ['admin'] },
    
    {
      label: 'Management',
      icon: 'manage_accounts',
      roles: ['admin'],
      subItems: [
        { path: '/admin/hods',        icon: 'supervisor_account', label: 'HOD Management' },
        { path: '/admin/incharges',   icon: 'badge',           label: 'Incharge Management' },
        { path: '/admin/departments', icon: 'corporate_fare',  label: 'Department Management' },
        { path: '/admin/students',    icon: 'school',          label: 'Student Management' },
        { path: '/admin/remarks',     icon: 'rate_review',     label: 'Remarks Management' },
      ]
    },

    { path: '/admin/analytics',   icon: 'analytics',       label: 'Analytics',            roles: ['admin'] },
    { path: '/admin/reports',     icon: 'summarize',       label: 'Reports',              roles: ['admin'] },
    { path: '/admin/activity-log',icon: 'list_alt',        label: 'Activity Log',         roles: ['admin'] },
    { path: '/admin/settings',    icon: 'settings',        label: 'System Settings',      roles: ['admin'] },
    { path: '/admin/profile',     icon: 'account_circle',  label: 'Profile',              roles: ['admin'] },
  ];

  const filteredNav = NAV.filter(link => {
    if (isAdmin) {
      return link.roles.includes('admin');
    }
    return link.roles.includes('all') ||
      (isIncharge && link.roles.includes('incharge')) ||
      (isHOD && link.roles.includes('hod'));
  });

  const getCurrentPageLabel = () => {
    for (const link of filteredNav) {
      if (link.path && location.pathname.startsWith(link.path)) {
        return link.label;
      }
      if (link.subItems) {
        const foundSub = link.subItems.find(sub => location.pathname.startsWith(sub.path));
        if (foundSub) return foundSub.label;
      }
    }
    return 'Dashboard';
  };
  const currentPage = getCurrentPageLabel();
  const sidebarW = isCollapsed ? 'md:w-[72px]' : 'md:w-64';

  const initials = (name) => name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex antialiased overflow-hidden w-full">

      {/* ── Mobile overlay ────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ═══════════════════ SIDEBAR ══════════════════════════════ */}
      <nav
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          transition-all duration-300 ease-in-out
          w-72
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 ${sidebarW}
          sidebar-premium
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-[18px] border-b border-white/[0.06]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
            style={{ background: `linear-gradient(135deg, ${deptAccent.from}, ${deptAccent.to})` }}
          >
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div className={`flex-1 min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
            <div className="font-display font-bold text-[15px] text-white leading-tight tracking-tight">DisciplineX</div>
            <div className="font-label text-[10px] text-white/40 uppercase tracking-widest">Discipline & Remarks</div>
          </div>
          {/* Desktop collapse */}
          <button
            className={`hidden md:flex p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
          {/* Mobile close */}
          <button
            className="md:hidden p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Role + dept badge */}
        <div className={`px-4 py-2.5 ${isCollapsed ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-label text-[11px] text-white/50 uppercase tracking-widest truncate">
              {userRole}{userDept ? ` · ${userDept}` : ''}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-3 space-y-0.5 px-3">
          {filteredNav.map((link) => {
            if (link.subItems) {
              const hasActiveSub = link.subItems.some(sub => location.pathname.startsWith(sub.path));
              return (
                <div key={link.label} className="space-y-1">
                  {/* Parent Dropdown Button */}
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        setIsManagementOpen(true);
                      } else {
                        setIsManagementOpen(!isManagementOpen);
                      }
                    }}
                    title={link.label}
                    className={`
                      w-full flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all duration-200 group relative overflow-hidden text-left cursor-pointer
                      ${isCollapsed ? 'md:justify-center md:px-2' : ''}
                      ${hasActiveSub
                        ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.07]'
                      }
                    `}
                  >
                    {hasActiveSub && !isManagementOpen && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                    )}
                    <span
                      className="material-symbols-outlined text-[20px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={hasActiveSub ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {link.icon}
                    </span>
                    <span className={`font-label font-semibold text-[13.5px] flex-1 ${isCollapsed ? 'md:hidden' : ''}`}>
                      {link.label}
                    </span>
                    {!isCollapsed && (
                      <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isManagementOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    )}
                  </button>

                  {/* Sub-items list */}
                  {isManagementOpen && !isCollapsed && (
                    <div className="pl-4 space-y-0.5 transition-all duration-300">
                      {link.subItems.map((sub) => {
                        const isSubActive = location.pathname.startsWith(sub.path);
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            title={sub.label}
                            className={`
                              flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 group relative overflow-hidden
                              ${isSubActive
                                ? 'text-white bg-white/[0.06] font-semibold'
                                : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                              }
                            `}
                          >
                            <span className="material-symbols-outlined text-[16px] shrink-0">
                              {sub.icon}
                            </span>
                            <span className="font-label text-[12px] flex-1">
                              {sub.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={`${link.path}-${link.label}`}
                to={link.path}
                title={link.label}
                className={`
                  flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all duration-200 group relative overflow-hidden
                  ${isCollapsed ? 'md:justify-center md:px-2' : ''}
                  ${isActive
                    ? 'nav-item-active text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.07]'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {link.icon}
                </span>
                <span className={`font-label font-semibold text-[13.5px] flex-1 ${isCollapsed ? 'md:hidden' : ''}`}>
                  {link.label}
                </span>
                {isActive && !isCollapsed && (
                  <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Bottom user section */}
        <div className="p-3 space-y-0.5">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/[0.07] hover:text-white transition-colors ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className={`font-label text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-colors ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className={`font-label text-[13px] font-medium ${isCollapsed ? 'md:hidden' : ''}`}>Sign Out</span>
          </button>

          {/* User avatar row */}
          <div className={`flex items-center gap-3 px-3 py-2.5 mt-0.5 rounded-xl ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-white text-sm shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${deptAccent.from}, ${deptAccent.to})` }}
            >
              {initials(userName)}
            </div>
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : ''}`}>
              <div className="font-label font-semibold text-[13px] text-white truncate">{userName}</div>
              <div className="font-label text-[11px] text-white/40 truncate">{userRole}{userDept ? ` · ${userDept}` : ''}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ═════════════════ MAIN AREA ════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>

        {/* ── Top Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-30 h-[60px] shrink-0
          bg-surface-container-lowest/80 backdrop-blur-2xl
          border-b border-outline-variant/15
          flex items-center justify-between px-5 md:px-7 gap-4 header-shadow">

          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-label text-on-surface-variant text-xs hidden sm:inline">MIC</span>
              <span className="text-outline-variant text-xs hidden sm:inline">/</span>
              {userDept && (
                <>
                  <span className="font-label text-on-surface-variant text-xs hidden sm:inline">{userDept}</span>
                  <span className="text-outline-variant text-xs hidden sm:inline">/</span>
                </>
              )}
              <span className="font-label font-semibold text-on-surface text-[13px]">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 text-xs font-label text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>

            {isIncharge && (
              <Link
                to="/registration"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl brand-gradient text-white font-label font-semibold text-[13px] shadow-brand-sm hover:opacity-95 transition-all active:scale-[.97]"
              >
                <span className="material-symbols-outlined text-[15px]">person_add</span>
                <span className="hidden sm:inline">Enroll</span>
              </Link>
            )}
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
