import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Clock, TrendingUp, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { getEventById, updateBasket, USER_ID } from '../services/api';
import { useToast } from '../components/Toast/useToast';
import { ToastContainer } from '../components/Toast/Toast';
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
  const { toasts, addToast, removeToast } = useToast();

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
      addToast(err.message || 'Failed to reserve tickets');
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
      <div className="detail-page container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Events</Link></li>
            <li className="breadcrumb-item active">Loading...</li>
          </ol>
        </nav>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="placeholder-glow mb-3">
              <div className="placeholder w-100 rounded" style={{ height: '300px' }} />
            </div>
            <div className="placeholder-glow">
              <span className="placeholder col-8 d-block mb-3 fs-4"></span>
              <span className="placeholder col-10 d-block mb-2"></span>
              <span className="placeholder col-6 d-block"></span>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-body placeholder-glow">
                <span className="placeholder col-6 d-block mb-3 fs-5"></span>
                <span className="placeholder col-8 d-block mb-2"></span>
                <span className="placeholder col-10 d-block"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="detail-page container-fluid py-4">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Events</Link></li>
            <li className="breadcrumb-item active">Error</li>
          </ol>
        </nav>
        <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
          <AlertCircle size={22} className="flex-shrink-0" />
          <div className="flex-grow-1">{error}</div>
          <Link to="/" className="btn btn-sm btn-outline-danger ms-2">Browse Events</Link>
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
    <div className="detail-page container-fluid py-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/">Events</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{event?.name || 'Event Detail'}</li>
        </ol>
      </nav>

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

      {/* Content Grid */}
      <div className="row g-4">
        {/* Main */}
        <div className="col-lg-8">
          {/* Event Description */}
          {event?.description && (
            <div className="card mb-3" id="event-description">
              <div className="card-body">
                <p className="small text-secondary mb-0 lh-lg">{event.description}</p>
              </div>
            </div>
          )}

          {/* Seat Map */}
          <div className="card mb-3" id="section-select">
            <div className="card-header">
              <h6 className="mb-0 fw-bold">SELECT YOUR SECTION</h6>
            </div>
            <div className="card-body">
              <p className="small text-secondary mb-3">Interactive arena map. Hover for availability.</p>
              <div className="d-flex gap-3 mb-3">
                <span className="d-flex align-items-center gap-2 small">
                  <span className="d-inline-block rounded-1" style={{ width: 12, height: 12, background: 'var(--primary)' }}></span>
                  AVAILABLE
                </span>
                <span className="d-flex align-items-center gap-2 small text-secondary">
                  <span className="d-inline-block rounded-1" style={{ width: 12, height: 12, background: '#D1D5DB' }}></span>
                  SOLD
                </span>
              </div>

              <div className="seat-map" id="seat-map">
                <svg viewBox="0 0 230 140" className="seat-map__svg">
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
            </div>
          </div>

          {/* Ticket Tiers */}
          <div id="ticket-tiers">
            <h5 className="fw-bold mb-3">TICKET TIERS</h5>
            {ticketTypes.map((tier) => (
              <div key={tier.name} className="card mb-3" id={`tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold mb-0">{tier.name.toUpperCase()}</h6>
                      {tier.availableQuantity <= 20 && tier.availableQuantity > 0 && (
                        <span className="badge bg-danger">{tier.availableQuantity <= 5 ? 'ALMOST GONE' : 'FEW LEFT'}</span>
                      )}
                      {tier.availableQuantity === 0 && (
                        <span className="badge bg-danger">SOLD OUT</span>
                      )}
                    </div>
                    <div className="text-end">
                      <span className="fw-black fs-5">${tier.price.toFixed(2)}</span>
                      <span className="text-secondary ms-1 small">+ FEES</span>
                    </div>
                  </div>
                  <p className="small text-secondary mb-3">
                    {tier.availableQuantity > 0 ? `${tier.availableQuantity} tickets remaining` : 'No tickets available'}
                  </p>
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="text-secondary fw-semibold" style={{ letterSpacing: '0.5px' }}>QUANTITY</small>
                    <div className="input-group input-group-sm" style={{ width: '130px' }}>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleQty(tier.name, -1)}
                        disabled={(quantities[tier.name] || 0) === 0}
                        id={`qty-minus-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="input-group-text justify-content-center fw-bold" style={{ minWidth: '44px' }}>
                        {quantities[tier.name] || 0}
                      </span>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleQty(tier.name, 1)}
                        disabled={tier.availableQuantity === 0 || (quantities[tier.name] || 0) >= tier.availableQuantity}
                        id={`qty-plus-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card" style={{ position: 'sticky', top: '80px' }} id="detail-footer">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-secondary fw-semibold" style={{ letterSpacing: '0.5px' }}>
                  SUBTOTAL ({totalTickets} TICKET{totalTickets !== 1 ? 'S' : ''})
                </small>
                <span className="fw-black fs-4">${subtotal.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                id="secure-tickets-btn"
                onClick={handleSecureTickets}
                disabled={totalTickets === 0 || addingToCart}
              >
                {addingToCart ? (
                  <><Loader size={18} className="spin-icon" /> RESERVING...</>
                ) : (
                  <>SECURE MY TICKETS <ArrowRight size={18} /></>
                )}
              </button>
              <p className="text-secondary text-center mb-0" style={{ fontSize: '0.72rem' }}>
                By clicking, you agree to our Terms of Sale. No refunds.
              </p>
            </div>
            <div className="card-footer d-flex align-items-start gap-3" id="demand-alert">
              <div className="rounded-2 p-2 bg-warning bg-opacity-10 d-inline-flex flex-shrink-0">
                <TrendingUp size={16} className="text-warning" />
              </div>
              <div>
                <div className="fw-bold small">DEMAND IS HIGH</div>
                <p className="text-secondary mb-0 small">1,240 people are looking at this event right now.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
