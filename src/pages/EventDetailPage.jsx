import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Clock, TrendingUp, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { getEventById, updateBasket, USER_ID } from '../services/api';
import { featuredEvent } from '../data/mockData';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEventById(id);
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleQty = (tierName, delta) => {
    setQuantities((prev) => {
      const current = prev[tierName] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [tierName]: next };
    });
  };

  const ticketTypes = event?.ticketTypes || [];
  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const subtotal = ticketTypes.reduce((total, tier) => {
    return total + (quantities[tier.name] || 0) * tier.price;
  }, 0);

  const handleSecureTickets = async () => {
    if (totalTickets === 0) return;

    setAddingToCart(true);
    setCartError(null);

    const items = ticketTypes
      .filter((tier) => (quantities[tier.name] || 0) > 0)
      .map((tier) => ({
        eventId: event.id,
        eventName: event.name,
        ticketTypeName: tier.name,
        unitPrice: tier.price,
        quantity: quantities[tier.name],
      }));

    try {
      await updateBasket({
        userId: USER_ID,
        items,
      });

      // Navigate to payment with basket context
      navigate('/payment', {
        state: {
          event,
          items,
          subtotal,
        },
      });
    } catch (err) {
      setCartError(err.message || 'Failed to reserve tickets');
    } finally {
      setAddingToCart(false);
    }
  };

  // Seat map sections
  const seatSections = [
    { id: 1, x: 20, y: 60, w: 40, h: 25, available: true },
    { id: 2, x: 70, y: 60, w: 40, h: 25, available: true },
    { id: 3, x: 120, y: 60, w: 40, h: 25, available: false },
    { id: 4, x: 20, y: 95, w: 40, h: 25, available: true },
    { id: 5, x: 70, y: 95, w: 40, h: 25, available: true },
    { id: 6, x: 120, y: 95, w: 40, h: 25, available: false },
    { id: 7, x: 170, y: 60, w: 40, h: 25, available: true },
    { id: 8, x: 170, y: 95, w: 40, h: 25, available: true },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="detail-page container">
        <div className="breadcrumb">
          <Link to="/">← Back to Events</Link>
        </div>
        <div className="detail-loading">
          <div className="detail-skeleton__hero shimmer" />
          <div className="detail-skeleton__content">
            <div className="detail-skeleton__title shimmer" />
            <div className="detail-skeleton__desc shimmer" />
            <div className="detail-skeleton__card shimmer" />
            <div className="detail-skeleton__card shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="detail-page container">
        <div className="breadcrumb">
          <Link to="/">← Back to Events</Link>
        </div>
        <div className="events-error" style={{ padding: '80px 16px' }}>
          <div className="events-error__icon">
            <AlertCircle size={28} />
          </div>
          <h3 className="events-error__title">Event Not Found</h3>
          <p className="events-error__text">{error}</p>
          <Link to="/" className="btn btn-outline events-error__btn">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = event?.imageUrl || featuredEvent.image;
  const heroTitle = event?.name?.toUpperCase() || 'EVENT';
  const heroSubtitle = event
    ? `${formatDate(event.date)} • ${event.venue}`
    : '';

  return (
    <div className="detail-page container">
      <div className="breadcrumb">
        <Link to="/">← Back to Events</Link>
      </div>

      {/* Countdown Bar */}
      <div className="countdown-bar" id="countdown-bar">
        <Clock size={14} />
        <span>TICKETS HELD FOR</span>
        <span className="countdown-bar__time">{formatTime(timeLeft)}</span>
      </div>

      {/* Hero Banner */}
      <div className="detail-hero" id="detail-hero">
        <img
          src={heroImage}
          alt={heroTitle}
          className="detail-hero__image"
          onError={(e) => {
            e.target.src = featuredEvent.image;
          }}
        />
        <div className="detail-hero__overlay">
          <h1 className="detail-hero__title">{heroTitle}</h1>
          <p className="detail-hero__subtitle">{heroSubtitle}</p>
        </div>
      </div>

      <div className="detail-content-grid">
        <div className="detail-main">
          {/* Event Description */}
          {event?.description && (
            <section className="event-description" id="event-description">
              <p className="event-description__text">{event.description}</p>
            </section>
          )}

      {/* Select Section */}
      <section className="section-select" id="section-select">
        <h2 className="section-select__title">SELECT YOUR SECTION</h2>
        <p className="section-select__desc">
          Interactive arena map.<br />Hover for availability.
        </p>
        <div className="section-select__legend">
          <span className="section-select__legend-item">
            <span className="section-select__dot section-select__dot--available"></span>
            AVAILABLE
          </span>
          <span className="section-select__legend-item">
            <span className="section-select__dot section-select__dot--sold"></span>
            SOLD
          </span>
        </div>

        {/* Seat Map SVG */}
        <div className="seat-map" id="seat-map">
          <svg viewBox="0 0 230 140" className="seat-map__svg">
            {/* Stage */}
            <rect x="60" y="10" width="110" height="35" rx="6" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
            <text x="115" y="32" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="700" letterSpacing="2">STAGE</text>
            
            {/* Seat Sections */}
            {seatSections.map((sec) => (
              <g key={sec.id}>
                <rect
                  x={sec.x}
                  y={sec.y}
                  width={sec.w}
                  height={sec.h}
                  rx="4"
                  fill={sec.available ? '#4F46E5' : '#D1D5DB'}
                  opacity={sec.available ? 0.85 : 0.5}
                  className={sec.available ? 'seat-map__section--available' : ''}
                />
              </g>
            ))}
          </svg>
        </div>
      </section>

      {/* Ticket Tiers */}
      <section className="ticket-tiers" id="ticket-tiers">
        <h2 className="ticket-tiers__title">TICKET TIERS</h2>

        {ticketTypes.map((tier) => (
          <div key={tier.name} className="tier-card card" id={`tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="tier-card__header">
              <div className="tier-card__name-row">
                <h3 className="tier-card__name">{tier.name.toUpperCase()}</h3>
                {tier.availableQuantity <= 20 && tier.availableQuantity > 0 && (
                  <span className="badge badge-red">
                    {tier.availableQuantity <= 5 ? 'ALMOST GONE' : 'FEW LEFT'}
                  </span>
                )}
                {tier.availableQuantity === 0 && (
                  <span className="badge badge-red">SOLD OUT</span>
                )}
              </div>
              <div className="tier-card__price">
                <span className="tier-card__amount">${tier.price.toFixed(2)}</span>
                <span className="tier-card__fees">+ FEES</span>
              </div>
            </div>
            <p className="tier-card__desc">
              {tier.availableQuantity > 0
                ? `${tier.availableQuantity} tickets remaining`
                : 'No tickets available'}
            </p>
            <div className="tier-card__qty">
              <span className="tier-card__qty-label">QUANTITY</span>
              <div className="tier-card__qty-controls">
                <button
                  className="tier-card__qty-btn"
                  onClick={() => handleQty(tier.name, -1)}
                  disabled={(quantities[tier.name] || 0) === 0}
                  id={`qty-minus-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Minus size={16} />
                </button>
                <span className="tier-card__qty-value">{quantities[tier.name] || 0}</span>
                <button
                  className="tier-card__qty-btn"
                  onClick={() => handleQty(tier.name, 1)}
                  disabled={tier.availableQuantity === 0 || (quantities[tier.name] || 0) >= tier.availableQuantity}
                  id={`qty-plus-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>

    <div className="detail-sidebar">

      {/* Cart Error */}
      {cartError && (
        <div className="cart-error" id="cart-error">
          <AlertCircle size={16} />
          <span>{cartError}</span>
        </div>
      )}

      {/* Subtotal & CTA */}
      <section className="detail-footer" id="detail-footer">
        <div className="detail-footer__subtotal">
          <span className="detail-footer__label">
            SUBTOTAL ({totalTickets} TICKET{totalTickets !== 1 ? 'S' : ''})
          </span>
          <span className="detail-footer__amount">${subtotal.toFixed(2)}</span>
        </div>

        <button
          className="btn btn-primary detail-footer__cta"
          id="secure-tickets-btn"
          style={{ width: '100%', padding: '16px' }}
          onClick={handleSecureTickets}
          disabled={totalTickets === 0 || addingToCart}
        >
          {addingToCart ? (
            <>
              <Loader size={18} className="spin-icon" /> RESERVING...
            </>
          ) : (
            <>
              SECURE MY TICKETS <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="detail-footer__disclaimer">
          By clicking, you agree to our Terms of Sale. No refunds.
        </p>

        {/* Demand Alert */}
        <div className="demand-alert" id="demand-alert">
          <div className="demand-alert__icon">
            <TrendingUp size={18} />
          </div>
          <div className="demand-alert__content">
            <strong>DEMAND IS HIGH</strong>
            <p>1,240 people are looking at this event right now.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</div>
  );
}
