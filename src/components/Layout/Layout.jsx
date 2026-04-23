import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface font-sans">
      <Header />
      <div className="pt-[73px]"> {/* Offset for fixed header */}
        <Outlet />
      </div>
    </div>
  );
}
