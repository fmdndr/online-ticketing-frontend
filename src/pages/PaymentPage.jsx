import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Mail, Shield, Lock, ChevronRight, Truck, Headphones, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { getBasket, checkout, USER_ID } from '../services/api';
import heroBanner from '../assets/images/event_hero_banner.png';
import './PaymentPage.css';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(true);

  // Checkout state
  const [processing, setProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null); // 'success' | 'error'
  const [checkoutMessage, setCheckoutMessage] = useState('');

  useEffect(() => {
    loadBasketData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadBasketData = async () => {
    setLoading(true);

    // Try to get data from navigation state first
    if (location.state?.items) {
      setBasketItems(location.state.items);
      setEventInfo(location.state.event);
      setTotalPrice(location.state.subtotal || 0);
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

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
      setCheckoutResult('error');
      setCheckoutMessage('Please fill in all payment fields.');
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
      setCheckoutResult('error');
      setCheckoutMessage(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Generate transaction ID
  const txId = `KNTC-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}IX`;

  const eventName = eventInfo?.name || basketItems[0]?.eventName || 'Event';
  const eventVenue = eventInfo?.venue || 'Venue';
  const eventImage = eventInfo?.imageUrl || heroBanner;
  const backTo = eventInfo?.id ? `/event/${eventInfo.id}` : '/';

  return (
    <div className="payment-page">
      <div className="breadcrumb breadcrumb--payment">
        <Link to={backTo}>← Back to Event</Link>
      </div>

      {/* Checkout Result Overlay */}
      {checkoutResult && (
        <div className={`checkout-result ${checkoutResult === 'success' ? 'checkout-result--success' : 'checkout-result--error'}`} id="checkout-result">
          <div className="checkout-result__card card">
            {checkoutResult === 'success' ? (
              <CheckCircle size={48} className="checkout-result__icon checkout-result__icon--success" />
            ) : (
              <XCircle size={48} className="checkout-result__icon checkout-result__icon--error" />
            )}
            <h2 className="checkout-result__title">
              {checkoutResult === 'success' ? 'Payment Confirmed!' : 'Payment Failed'}
            </h2>
            <p className="checkout-result__message">{checkoutMessage}</p>
            {checkoutResult === 'success' ? (
              <div className="checkout-result__actions">
                <Link to="/orders" className="btn btn-primary checkout-result__btn">
                  View My Orders
                </Link>
                <Link to="/" className="btn btn-outline checkout-result__btn">
                  Browse More Events
                </Link>
              </div>
            ) : (
              <button
                className="btn btn-outline checkout-result__btn"
                onClick={() => setCheckoutResult(null)}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="payment-hero" id="payment-hero">
        <h1 className="payment-hero__title">
          COMPLETE SECURE<br />PAYMENT
        </h1>
        <p className="payment-hero__desc">
          Review your transaction and finalize the ledger entry.
        </p>
      </section>

      {/* Card Form */}
      <section className="payment-form card" id="payment-form">
        <div className="payment-form__header">
          <h3 className="payment-form__title">Credit or Debit Card</h3>
          <div className="payment-form__icons">
            <Mail size={16} />
            <Shield size={16} />
          </div>
        </div>

        <div className="payment-form__field">
          <label className="payment-form__label">CARDHOLDER NAME</label>
          <input
            type="text"
            className="payment-form__input"
            placeholder="ALEXANDER KINETIC"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            id="cardholder-name"
          />
        </div>

        <div className="payment-form__field">
          <label className="payment-form__label">CARD NUMBER</label>
          <div className="payment-form__input-wrap">
            <input
              type="text"
              className="payment-form__input"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              id="card-number"
            />
            <CreditCard size={18} className="payment-form__input-icon" />
          </div>
        </div>

        <div className="payment-form__row">
          <div className="payment-form__field payment-form__field--half">
            <label className="payment-form__label">EXPIRY DATE</label>
            <input
              type="text"
              className="payment-form__input"
              placeholder="MM / YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={7}
              id="expiry-date"
            />
          </div>
          <div className="payment-form__field payment-form__field--half">
            <label className="payment-form__label">CVC / CVV</label>
            <input
              type="text"
              className="payment-form__input"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              id="cvc-input"
            />
          </div>
        </div>

        <label className="payment-form__checkbox" id="save-card-checkbox">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
          />
          <span>Save card details for future high-velocity events</span>
        </label>
      </section>

      {/* Processing State Preview */}
      {processing && (
        <section className="processing-preview processing-preview--active" id="processing-preview">
          <p className="processing-preview__label">TRANSACTION IN PROGRESS</p>
          <div className="processing-preview__bar">
            <Loader size={16} className="spin-icon" />
            <span>Processing Secure Transaction...</span>
          </div>
        </section>
      )}

      {/* Event Preview Card */}
      <section className="event-preview" id="event-preview">
        <div className="event-preview__card">
          <img
            src={eventImage}
            alt="Event"
            className="event-preview__image"
            onError={(e) => { e.target.src = heroBanner; }}
          />
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
      </section>

      {/* Order Summary */}
      <section className="order-summary" id="order-summary">
        <div className="order-summary__header">
          <span className="order-summary__tx-label">TRANSACTION ID</span>
          <span className="order-summary__tx-id">{txId}</span>
        </div>

        {/* Dynamic basket items */}
        {basketItems.length > 0 ? (
          basketItems.map((item, i) => (
            <div className="order-summary__line" key={i}>
              <div>
                <strong>{item.ticketTypeName} × {item.quantity}</strong>
                <p className="order-summary__line-sub">{item.eventName}</p>
              </div>
              <span className="order-summary__line-amount">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <div className="order-summary__line">
            <div>
              <strong>No items in basket</strong>
              <p className="order-summary__line-sub">Add tickets to continue</p>
            </div>
            <span className="order-summary__line-amount">$0.00</span>
          </div>
        )}

        <div className="order-summary__line">
          <div>
            <strong>Facility & Processing Fee</strong>
          </div>
          <span className="order-summary__line-amount">${serviceFee.toFixed(2)}</span>
        </div>

        <div className="order-summary__line">
          <div>
            <strong>Insurance (Protection Plan)</strong>
          </div>
          <span className="order-summary__line-amount">${insuranceFee.toFixed(2)}</span>
        </div>

        {/* Total */}
        <div className="order-summary__total" id="order-total">
          <div className="order-summary__total-label">TOTAL PAYABLE</div>
          <div className="order-summary__total-row">
            <span className="order-summary__total-amount">${grandTotal.toFixed(2)}</span>
            <span className="order-summary__total-currency">USD</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          className="btn btn-primary order-summary__pay-btn"
          id="pay-now-btn"
          onClick={handleCheckout}
          disabled={processing || basketItems.length === 0}
        >
          {processing ? (
            <>
              <Loader size={18} className="spin-icon" /> PROCESSING...
            </>
          ) : (
            <>
              PAY NOW <ChevronRight size={18} />
            </>
          )}
        </button>

        {/* Security Badge */}
        <div className="order-summary__security">
          <Lock size={12} />
          <span>256-BIT SSL SECURED LEDGER</span>
        </div>
      </section>

      {/* Priority Cards */}
      <section className="priority-cards" id="priority-cards">
        <div className="priority-card">
          <div className="priority-card__icon priority-card__icon--green">
            <Truck size={18} />
          </div>
          <div>
            <span className="priority-card__label">PRIORITY</span>
            <strong>Delivery</strong>
          </div>
        </div>
        <div className="priority-card">
          <div className="priority-card__icon priority-card__icon--purple">
            <Headphones size={18} />
          </div>
          <div>
            <span className="priority-card__label">PRIORITY</span>
            <strong>Concierge</strong>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="payment-footer" id="payment-footer">
        <div className="payment-footer__links">
          <a href="#">Terms of Sale</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Anti-Scalper Policy</a>
        </div>
        <p className="payment-footer__copy">© 2026 KINETIC TICKETING SYSTEMS INC.</p>
      </footer>
    </div>
  );
}
