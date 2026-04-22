import { Outlet } from 'react-router-dom';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout__content">
        <Outlet />
      </div>
    </div>
  );
}
