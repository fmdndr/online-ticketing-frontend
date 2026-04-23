import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, CheckCircle, XCircle, Clock, ArrowRight, Ticket, RefreshCw } from 'lucide-react';
import { getPaymentsByUserId } from '../services/api';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EventGridSkeleton } from '../components/States/LoadingState';
import { EmptyState } from '../components/States/EmptyState';
import { ErrorState } from '../components/States/ErrorState';
import { useNavigate } from 'react-router-dom';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate('/login');
      return;
    }
    fetchOrders();

    // Auto-refresh once after 2.5 seconds to handle Kafka eventual consistency delays
    const timer = setTimeout(() => {
      fetchOrders(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);
    try {
      const data = await getPaymentsByUserId();
      setPayments(data || []);
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load orders');
    } finally {
      if (!isSilent) setLoading(false);
      else setRefreshing(false);
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
    if (status === 2 || status === 'Completed') {
      return { key: 'completed', label: 'COMPLETED', icon: CheckCircle, badgeVariant: 'available' };
    }
    if (status === 3 || status === 'Failed') {
      return { key: 'failed', label: 'FAILED', icon: XCircle, badgeVariant: 'urgency' };
    }
    return { key: 'pending', label: 'PENDING', icon: Clock, badgeVariant: 'available' };
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-surface py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest text-on-surface mb-2 uppercase">
              My Orders
            </h1>
            <p className="text-on-surface-variant font-retina text-lg">
              Track your ticket purchases and transaction history.
            </p>
          </div>
          <button 
            onClick={() => fetchOrders(true)} 
            disabled={refreshing || loading}
            className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            REFRESH
          </button>
        </div>

        {loading && <EventGridSkeleton />}

        {error && !loading && (
          <div className="flex justify-center my-12">
            <ErrorState message={error} onRetry={fetchOrders} />
          </div>
        )}

        {!loading && !error && payments.length === 0 && (
          <EmptyState message="When you purchase tickets, your order history will appear here." />
        )}

        {!loading && !error && payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map((payment, index) => {
              const status = getStatusInfo(payment.status);
              const StatusIcon = status.icon;
              return (
                <Link 
                  to={`/orders/${payment.orderId}`}
                  key={payment.id} 
                  className="bg-surface-container-lowest rounded shadow-ambient border border-outline-variant/15 overflow-hidden flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:-translate-y-1 block cursor-pointer"
                >
                  <div className="bg-surface-container-low p-4 flex items-center justify-between border-b border-outline-variant/15">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Ticket size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-on-surface truncate uppercase">{payment.ticketTypeName}</div>
                        <div className="font-mono text-xs text-on-surface-variant">
                          {payment.orderId ? payment.orderId.substring(0, 8) + '...' : '-'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={status.badgeVariant} className="flex items-center gap-1 shrink-0 ml-2">
                      <StatusIcon size={12} />
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="p-6 flex-grow flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold tracking-wider text-on-surface-variant uppercase mb-1">Quantity</div>
                      <div className="font-mono font-bold text-on-surface">{payment.quantity} ticket{payment.quantity !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold tracking-wider text-on-surface-variant uppercase mb-1">Total</div>
                      <div className="font-mono text-xl font-bold text-primary">${(payment.totalAmount || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 border-t border-outline-variant/15 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-retina text-on-surface-variant">
                      <span>Created: {formatDate(payment.createdAt)}</span>
                      {payment.completedAt && (
                        <span className="text-primary font-bold flex items-center gap-1"><CheckCircle size={10} /> {formatDate(payment.completedAt)}</span>
                      )}
                    </div>
                    {payment.failureReason && (
                      <div className="text-xs text-[#c20038] bg-[#ffeceb] px-2 py-1 rounded font-retina flex items-center gap-1 mt-1">
                        <XCircle size={12} />
                        {payment.failureReason}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
