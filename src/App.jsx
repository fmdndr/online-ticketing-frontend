import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import PaymentPage from './pages/PaymentPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/account" element={<OrdersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
