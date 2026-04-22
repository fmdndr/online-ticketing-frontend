import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CreditCard, Mail, Shield, Lock, ChevronRight, Truck, Headphones, Clock, CheckCircle, Loader } from 'lucide-react';
import { getBasket, checkout, USER_ID } from '../services/api';
import { useToast } from '../components/Toast/useToast';
import { ToastContainer } from '../components/Toast/Toast';
import heroBanner from '../assets/images/event_hero_banner.png';
import './PaymentPage.css';

export default function PaymentPage() {
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToast();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [timer, setTimer] = useState(292);

  // Basket data
  const [basketItems, setBasketItems] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Checkout state
  const [processing, setProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null); // 'success' | 'error'
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const loadBasketData = useCallback(async () => {
    // Try to get data from navigation state first
    if (location.state?.items) {
      setBasketItems(location.state.items);
      setEventInfo(location.state.event);
      setTotalPrice(location.state.subtotal || 0);
      return;
    }

    // Fallback: fetch basket from API
    try {
      const basket = await getBasket(USER_ID);
      if (basket?.items?.length > 0) {
        setBasketItems(basket.items);
        setTotalPrice(basket.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
      }
    } catch {
      // Basket may not exist yet
    }
  }, [location]);

  useEffect(() => {
    loadBasketData();
  }, [loadBasketData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  // Processing fees
  const serviceFee = totalPrice > 0 ? 18.50 : 0;
  const insuranceFee = totalPrice > 0 ? 12.00 : 0;
  const grandTotal = totalPrice + serviceFee + insuranceFee;

  const handleCheckout = async () => {
    // Basic validation
    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      addToast('Please fill in all payment fields.', 'warning');
      return;
    }

    setProcessing(true);
    setCheckoutResult(null);
    setCheckoutMessage('');

    try {
      await checkout({
        userId: USER_ID,
        totalPrice: grandTotal,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardHolderName: cardName,
      });

      setCheckoutResult('success');
      setCheckoutMessage('Your tickets have been confirmed! Payment is being processed.');
    } catch (err) {
      addToast(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Generate transaction ID
  const txId = `SRTE-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}IX`;

  const eventName = eventInfo?.name || basketItems[0]?.eventName || 'Event';
  const eventVenue = eventInfo?.venue || 'Venue';
  const eventImage = eventInfo?.imageUrl || heroBanner;
  const backTo = eventInfo?.id ? `/event/${eventInfo.id}` : '/';

  return (
    <div className="payment-page container-fluid py-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to={backTo}>Back to Event</Link></li>
          <li className="breadcrumb-item active">Payment</li>
        </ol>
      </nav>

      {/* Success Overlay */}
      {checkoutResult === 'success' && (
        <>
          <div className="modal show d-block" style={{ zIndex: 1055 }} data-bs-theme="dark">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content text-center p-2">
                <div className="modal-body">
                  <CheckCircle size={56} className="text-success mb-3" />
                  <h4 className="fw-bold mb-2">Payment Confirmed!</h4>
                  <p className="text-secondary mb-4">{checkoutMessage}</p>
                  <div className="d-flex gap-2 justify-content-center">
                    <Link to="/orders" className="btn btn-primary">View My Orders</Link>
                    <Link to="/" className="btn btn-outline-secondary">Browse Events</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{ zIndex: 1054 }} />
        </>
      )}

      <div className="row g-4 justify-content-center">
        {/* Left: Hero + Form */}
        <div className="col-lg-7">
          {/* Hero */}
          <div className="mb-4" id="payment-hero">
            <h2 className="fw-black mb-1 lh-1">COMPLETE SECURE<br />PAYMENT</h2>
            <p className="text-secondary small mb-0">Review your transaction and finalize the ledger entry.</p>
          </div>

          {/* Card Form */}
          <div className="card mb-3" id="payment-form">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">Credit or Debit Card</h6>
              <div className="d-flex gap-2 text-secondary"><Mail size={15} /><Shield size={15} /></div>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small text-uppercase text-secondary">Cardholder Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ALEXANDER SOCRATIC"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  id="cardholder-name"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-uppercase text-secondary">Card Number</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    id="card-number"
                  />
                  <span className="input-group-text"><CreditCard size={16} /></span>
                </div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small text-uppercase text-secondary">Expiry Date</label>
                  <input type="text" className="form-control" placeholder="MM / YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} maxLength={7} id="expiry-date" />
                </div>
                <div className="col-6">
                  <label className="form-label small text-uppercase text-secondary">CVC / CVV</label>
                  <input type="text" className="form-control" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} id="cvc-input" />
                </div>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="save-card-check" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                <label className="form-check-label small text-secondary" htmlFor="save-card-check">
                  Save card details for future high-velocity events
                </label>
              </div>
            </div>
          </div>

          {/* Processing */}
          {processing && (
            <div className="card mb-3" id="processing-preview">
              <div className="card-body d-flex align-items-center gap-3">
                <Loader size={20} className="spin-icon text-primary flex-shrink-0" />
                <div>
                  <p className="text-secondary mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px', fontWeight: 600 }}>TRANSACTION IN PROGRESS</p>
                  <small className="fw-semibold">Processing Secure Transaction...</small>
                </div>
              </div>
            </div>
          )}

          {/* Priority Cards */}
          <div className="row g-3" id="priority-cards">
            <div className="col-6">
              <div className="card">
                <div className="card-body d-flex align-items-center gap-3 py-3">
                  <div className="rounded-2 p-2 bg-success bg-opacity-10 d-inline-flex flex-shrink-0"><Truck size={16} className="text-success" /></div>
                  <div><small className="text-secondary d-block" style={{ fontSize: '0.62rem' }}>PRIORITY</small><strong className="small">Delivery</strong></div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card">
                <div className="card-body d-flex align-items-center gap-3 py-3">
                  <div className="rounded-2 p-2 bg-primary bg-opacity-10 d-inline-flex flex-shrink-0"><Headphones size={16} className="text-primary" /></div>
                  <div><small className="text-secondary d-block" style={{ fontSize: '0.62rem' }}>PRIORITY</small><strong className="small">Concierge</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Event preview + Order Summary */}
        <div className="col-lg-5">
          {/* Event Preview */}
          <div className="event-preview mb-3" id="event-preview">
            <div className="event-preview__card">
              <img src={eventImage} alt="Event" className="event-preview__image" onError={(e) => { e.target.src = heroBanner; }} />
              <div className="event-preview__overlay">
                <span className="event-preview__confirmed badge badge-green">
                  {checkoutResult === 'success' ? 'CONFIRMED' : 'PENDING'}
                </span>
                <h3 className="event-preview__title">{eventName.toUpperCase()}</h3>
                <p className="event-preview__venue">{eventVenue}</p>
                <div className="event-preview__timer">
                  <Clock size={12} />
                  <span>TIMER</span>
                  <span className="event-preview__timer-value">{formatTimer(timer)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card mb-3" id="order-summary">
            <div className="card-header d-flex justify-content-between align-items-center">
              <small className="text-secondary fw-semibold" style={{ letterSpacing: '0.5px' }}>TRANSACTION ID</small>
              <small className="fw-semibold" style={{ fontFamily: 'monospace' }}>{txId}</small>
            </div>
            <ul className="list-group list-group-flush">
              {basketItems.length > 0 ? (
                basketItems.map((item, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-start px-3 py-2">
                    <div>
                      <div className="fw-semibold small">{item.ticketTypeName} × {item.quantity}</div>
                      <div className="text-secondary small">{item.eventName}</div>
                    </div>
                    <span className="fw-bold small">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <li className="list-group-item d-flex justify-content-between px-3 py-2">
                  <div><div className="fw-semibold small">No items in basket</div><div className="text-secondary small">Add tickets to continue</div></div>
                  <span className="fw-bold small">$0.00</span>
                </li>
              )}
              <li className="list-group-item d-flex justify-content-between px-3 py-2">
                <small>Facility &amp; Processing Fee</small><small className="fw-semibold">${serviceFee.toFixed(2)}</small>
              </li>
              <li className="list-group-item d-flex justify-content-between px-3 py-2">
                <small>Insurance (Protection Plan)</small><small className="fw-semibold">${insuranceFee.toFixed(2)}</small>
              </li>
            </ul>
            <div className="card-body" id="order-total">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="fw-semibold text-secondary" style={{ letterSpacing: '0.5px' }}>TOTAL PAYABLE</small>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fw-black fs-4">${grandTotal.toFixed(2)}</span>
                  <small className="text-secondary">USD</small>
                </div>
              </div>
              <button
                className="btn btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                id="pay-now-btn"
                onClick={handleCheckout}
                disabled={processing || basketItems.length === 0}
              >
                {processing ? (
                  <><Loader size={18} className="spin-icon" /> PROCESSING...</>
                ) : (
                  <>PAY NOW <ChevronRight size={18} /></>
                )}
              </button>
              <div className="d-flex align-items-center justify-content-center gap-2 text-secondary">
                <Lock size={12} />
                <small style={{ fontSize: '0.65rem', letterSpacing: '0.8px' }}>256-BIT SSL SECURED LEDGER</small>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center" id="payment-footer">
            <div className="d-flex justify-content-center gap-3 mb-2">
              <a href="#" className="text-secondary small text-decoration-none">Terms of Sale</a>
              <a href="#" className="text-secondary small text-decoration-none">Privacy Policy</a>
              <a href="#" className="text-secondary small text-decoration-none">Anti-Scalper Policy</a>
            </div>
            <p className="text-secondary mb-0 small">© 2026 SOCRATIC EVENT INC.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
