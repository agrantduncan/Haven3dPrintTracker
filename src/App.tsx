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

function NavItems() {
  return (
    <>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            boxShadow: isActive ? 'inset 0 0 8px var(--accent-dim)' : 'none',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 400,
            transition: 'all 150ms',
            minHeight: '44px',
          })}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}

function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — shown at 768px+ */}
      <aside style={{
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
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }} className="app-sidebar">
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <h1 className="font-fantasy" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '2px' }}>
            FROSTHAVEN
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>3D Print Tracker</p>
        </div>
        <nav style={{ marginTop: '8px' }}>
          <NavItems />
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minHeight: '100vh' }} className="app-main">
        <div style={{ padding: '24px', maxWidth: '100%' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/print-queue" element={<PrintQueue />} />
          </Routes>
        </div>
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="app-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}>
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
              justifyContent: 'center',
              padding: '8px 4px',
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              textDecoration: 'none',
              fontSize: '10px',
              gap: '3px',
              transition: 'color 150ms',
              minHeight: '56px',
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        /* Desktop / iPad: show sidebar, hide bottom nav */
        @media (min-width: 768px) {
          .app-sidebar { display: flex !important; }
          .app-main { margin-left: 220px; padding-bottom: 0; }
          .app-bottom-nav { display: none !important; }
        }
        /* Mobile: hide sidebar, show bottom nav */
        @media (max-width: 767px) {
          .app-sidebar { display: none !important; }
          .app-main { margin-left: 0; }
          .app-main > div { padding: 16px 12px 80px !important; }
          .app-bottom-nav { display: flex !important; }
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
