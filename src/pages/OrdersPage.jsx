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
      return { label: 'COMPLETED', icon: CheckCircle, className: 'order-status--completed' };
    }
    if (status === 3 || status === 'Failed') {
      return { label: 'FAILED', icon: XCircle, className: 'order-status--failed' };
    }
    return { label: 'PENDING', icon: Clock, className: 'order-status--pending' };
  };

  return (
    <div className="orders-page container">
      {/* Hero */}
      <section className="orders-hero" id="orders-hero">
        <h1 className="orders-hero__title">MY ORDERS</h1>
        <p className="orders-hero__desc">
          Track your ticket purchases and transaction history.
        </p>
      </section>

      {/* Loading */}
      {loading && (
        <div className="orders-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="order-skeleton shimmer" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="orders-error" id="orders-error">
          <div className="orders-error__icon">
            <AlertCircle size={28} />
          </div>
          <h3 className="orders-error__title">Unable to Load Orders</h3>
          <p className="orders-error__text">{error}</p>
          <button className="btn btn-outline" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && payments.length === 0 && (
        <div className="orders-empty" id="orders-empty">
          <div className="orders-empty__icon">
            <ShoppingBag size={32} />
          </div>
          <h3 className="orders-empty__title">No Orders Yet</h3>
          <p className="orders-empty__text">
            When you purchase tickets, your order history will appear here.
          </p>
          <Link to="/" className="btn btn-primary orders-empty__btn">
            Browse Events <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && payments.length > 0 && (
        <section className="orders-list" id="orders-list">
          {payments.map((payment, index) => {
            const status = getStatusInfo(payment.status);
            const StatusIcon = status.icon;

            return (
              <div
                key={payment.id}
                className="order-card card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
                id={`order-card-${index}`}
              >
                <div className="order-card__header">
                  <div className="order-card__icon">
                    <Ticket size={18} />
                  </div>
                  <div className="order-card__header-info">
                    <span className="order-card__ticket-type">{payment.ticketTypeName}</span>
                    <span className="order-card__order-id">
                      {payment.orderId ? payment.orderId.substring(0, 8) + '...' : '-'}
                    </span>
                  </div>
                  <span className={`order-card__status ${status.className}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>

                <div className="order-card__details">
                  <div className="order-card__detail">
                    <span className="order-card__detail-label">QUANTITY</span>
                    <span className="order-card__detail-value">{payment.quantity} ticket{payment.quantity !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="order-card__detail">
                    <span className="order-card__detail-label">TOTAL</span>
                    <span className="order-card__detail-value order-card__detail-value--price">
                      ${(payment.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="order-card__footer">
                  <span className="order-card__date">{formatDate(payment.createdAt)}</span>
                  {payment.completedAt && (
                    <span className="order-card__completed">
                      Completed: {formatDate(payment.completedAt)}
                    </span>
                  )}
                </div>

                {payment.failureReason && (
                  <div className="order-card__failure">
                    <AlertCircle size={12} />
                    <span>{payment.failureReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
