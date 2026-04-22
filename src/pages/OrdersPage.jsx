import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, CheckCircle, XCircle, Clock, AlertCircle, Loader, ArrowRight, Ticket } from 'lucide-react';
import { getPaymentsByUserId, USER_ID } from '../services/api';
import './OrdersPage.css';

export default function OrdersPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentsByUserId(USER_ID);
      setPayments(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status) => {
    // Handle both numeric (enum) and string status
    if (status === 2 || status === 'Completed') {
      return { label: 'COMPLETED', icon: CheckCircle, className: 'order-status--completed', badgeClass: 'bg-success' };
    }
    if (status === 3 || status === 'Failed') {
      return { label: 'FAILED', icon: XCircle, className: 'order-status--failed', badgeClass: 'bg-danger' };
    }
    return { label: 'PENDING', icon: Clock, className: 'order-status--pending', badgeClass: 'bg-warning text-dark' };
  };

  return (
    <div className="orders-page container-fluid py-4">
      {/* Hero */}
      <div className="mb-4">
        <h2 className="fw-black mb-1">MY ORDERS</h2>
        <p className="text-secondary small mb-0">Track your ticket purchases and transaction history.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="row g-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4">
              <div className="card">
                <div className="card-header"><div className="placeholder-glow"><span className="placeholder col-6"></span></div></div>
                <div className="card-body"><div className="placeholder-glow"><span className="placeholder col-8 d-block mb-2"></span><span className="placeholder col-4 d-block"></span></div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-danger d-flex align-items-center gap-3 my-3" role="alert" id="orders-error">
          <AlertCircle size={22} className="flex-shrink-0" />
          <div className="flex-grow-1">{error}</div>
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && payments.length === 0 && (
        <div className="text-center py-5" id="orders-empty">
          <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-4 mb-3">
            <ShoppingBag size={32} className="text-primary" />
          </div>
          <h5 className="fw-bold mb-2">No Orders Yet</h5>
          <p className="text-secondary small mb-4">When you purchase tickets, your order history will appear here.</p>
          <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
            Browse Events <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Orders Grid */}
      {!loading && !error && payments.length > 0 && (
        <div className="row g-3" id="orders-list">
          {payments.map((payment, index) => {
            const status = getStatusInfo(payment.status);
            const StatusIcon = status.icon;
            return (
              <div key={payment.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card h-100 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.08}s` }}
                  id={`order-card-${index}`}
                >
                  <div className="card-header d-flex align-items-center gap-3">
                    <div className="rounded-2 p-2 bg-primary bg-opacity-10 d-inline-flex flex-shrink-0">
                      <Ticket size={16} className="text-primary" />
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold small text-truncate">{payment.ticketTypeName}</div>
                      <div className="text-secondary" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                        {payment.orderId ? payment.orderId.substring(0, 8) + '...' : '-'}
                      </div>
                    </div>
                    <span className={`badge d-inline-flex align-items-center gap-1 flex-shrink-0 ${status.badgeClass}`}>
                      <StatusIcon size={11} />
                      {status.label}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <p className="text-secondary mb-1" style={{ fontSize: '0.63rem', letterSpacing: '0.5px', fontWeight: 600 }}>QUANTITY</p>
                        <p className="fw-semibold small mb-0">{payment.quantity} ticket{payment.quantity !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="col-6">
                        <p className="text-secondary mb-1" style={{ fontSize: '0.63rem', letterSpacing: '0.5px', fontWeight: 600 }}>TOTAL</p>
                        <p className="fw-bold small mb-0 text-primary">${(payment.totalAmount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer d-flex justify-content-between align-items-center">
                    <small className="text-secondary">{formatDate(payment.createdAt)}</small>
                    {payment.completedAt && (
                      <small className="text-success">✓ {formatDate(payment.completedAt)}</small>
                    )}
                  </div>
                  {payment.failureReason && (
                    <div className="card-footer border-top-0 pt-0 text-danger d-flex align-items-center gap-1">
                      <AlertCircle size={12} />
                      <small>{payment.failureReason}</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
