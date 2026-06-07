import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Package, Printer } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Scenarios from './pages/Scenarios';
import Inventory from './pages/Inventory';
import PrintQueue from './pages/PrintQueue';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scenarios', icon: Map, label: 'Scenarios' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/print-queue', icon: Printer, label: 'Print Queue' },
];

function NavItems({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onClick}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            boxShadow: isActive ? 'inset 0 0 8px var(--accent-dim)' : 'none',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 400,
            transition: 'all 150ms',
          })}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

function BottomTabBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            textDecoration: 'none',
            fontSize: '11px',
            gap: '3px',
            transition: 'color 150ms',
          })}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <aside
        className="sidebar"
        style={{
          width: 220,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <h1
            className="font-fantasy"
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '2px' }}
          >
            FROSTHAVEN
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>3D Print Tracker</p>
        </div>
        <nav style={{ marginTop: '8px' }}>
          <NavItems />
        </nav>
      </aside>

      {/* Main content */}
      <main
        className="main-content"
        style={{
          flex: 1,
          marginLeft: 220,
          padding: '24px',
          minHeight: '100vh',
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/print-queue" element={<PrintQueue />} />
        </Routes>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />

      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 16px 12px 80px !important; }
        }
        @media (min-width: 769px) {
          nav.mobile-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
