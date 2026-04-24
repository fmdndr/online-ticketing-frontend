import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { getEventById, updateBasket, getUserId } from '../services/api';
import { useToast } from '../components/Toast/useToast';
import { ToastContainer } from '../components/Toast/Toast';
import { featuredEvent } from '../data/mockData';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EventGridSkeleton } from '../components/States/LoadingState';
import { ErrorState } from '../components/States/ErrorState';

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

    if (!localStorage.getItem('auth_token')) {
      navigate('/login', { state: { from: `/event/${event.id}` } });
      return;
    }

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
        userId: getUserId(),
        items,
      });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface py-12 px-6">
        <EventGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-6">
        <ErrorState message={error} onRetry={fetchEvent} />
      </div>
    );
  }

  const heroImage = event?.imageUrl || featuredEvent.image;
  const heroTitle = event?.name?.toUpperCase() || 'EVENT';
  const heroSubtitle = event
    ? `${formatDate(event.date)} • ${event.venue}`
    : '';

  return (
    <div className="min-h-screen bg-surface pb-16">
      <ToastContainer toasts={toasts} onRemove={removeToast} />


      <div className="bg-tertiary-container text-on-tertiary-fixed py-2 px-6 flex justify-center md:justify-between items-center font-mono text-sm sticky top-0 z-50 shadow-ambient">
        <span className="hidden md:inline font-bold">HIGH DEMAND TICKET POOL</span>
        <div className="flex gap-4 items-center">
          <Clock size={16} />
          <span>TICKETS HELD FOR</span>
          <span className="font-bold text-lg" aria-live="polite">{formatTime(timeLeft)}</span>
        </div>
      </div>


      <div className="relative h-48 sm:h-64 md:h-96 w-full">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img
          src={heroImage}
          alt={heroTitle}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = featuredEvent.image;
          }}
        />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20 bg-gradient-to-t from-black via-black/60 to-transparent">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-6xl font-extrabold tracking-tightest text-white mb-2 uppercase leading-tight">{heroTitle}</h1>
            <p className="text-white/80 font-retina text-sm md:text-lg">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

        <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">

          {event?.description && (
             <section className="bg-surface-container-low p-6 md:p-8 rounded-2xl">
                <p className="text-on-surface-variant font-retina text-sm md:text-base leading-relaxed">{event.description}</p>
             </section>
          )}

          <section className="bg-surface-container-low p-6 md:p-12 rounded-2xl">
             <h2 className="text-2xl md:text-3xl font-extrabold tracking-tightest mb-6 md:mb-8 text-on-surface uppercase">Select Your Section</h2>


             <div className="aspect-video bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex items-center justify-center relative shadow-ambient overflow-hidden p-4">
                <svg viewBox="0 0 230 140" className="w-full h-full max-h-[400px]">
                    <rect x="60" y="10" width="110" height="35" rx="6" fill="var(--color-surface-container-highest)" stroke="var(--color-outline-variant)" strokeWidth="1.5" strokeOpacity="0.15" />
                    <text x="115" y="32" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="2" className="text-on-surface-variant font-sans">STAGE</text>


                    {seatSections.map((sec) => (
                      <g key={sec.id}>
                        <rect
                          x={sec.x}
                          y={sec.y}
                          width={sec.w}
                          height={sec.h}
                          rx="4"
                          fill={sec.available ? 'var(--color-primary)' : 'var(--color-surface-container-highest)'}
                          opacity={sec.available ? 0.85 : 0.5}
                          className={`transition-all duration-300 ${sec.available ? 'hover:opacity-100 hover:scale-105 cursor-pointer origin-center shadow-primary' : ''}`}
                          style={{ transformBox: 'fill-box' }}
                        />
                      </g>
                    ))}
                  </svg>
             </div>
          </section>
        </div>


        <aside className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-ambient lg:sticky lg:top-24">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tightest mb-6 text-on-surface uppercase">Ticket Tiers</h3>

            <div className="space-y-3">
              {ticketTypes.map((tier) => (
                <div key={tier.name} className="p-4 bg-surface-container-low rounded-xl border border-transparent hover:border-outline-variant/15 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="font-extrabold text-on-surface uppercase text-sm">{tier.name}</div>
                      {tier.availableQuantity <= 20 && tier.availableQuantity > 0 && (
                        <Badge variant="urgency">{tier.availableQuantity <= 5 ? 'ALMOST GONE' : 'FEW LEFT'}</Badge>
                      )}
                      {tier.availableQuantity === 0 && (
                        <Badge variant="urgency">SOLD OUT</Badge>
                      )}
                    </div>
                    <div className="text-end">
                      <span className="font-mono text-base md:text-lg font-bold">${tier.price.toFixed(2)}</span>
                      <span className="text-on-surface-variant ms-1 text-[10px]">+ FEES</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Quantity</span>
                    <div className="flex items-center bg-surface-container-high rounded-lg p-1">
                      <button
                        className="p-1 w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-lowest transition-colors disabled:opacity-50"
                        onClick={() => handleQty(tier.name, -1)}
                        disabled={(quantities[tier.name] || 0) === 0}
                      >
                        -
                      </button>
                      <span className="font-mono w-8 text-center font-bold text-sm">
                        {quantities[tier.name] || 0}
                      </span>
                      <button
                        className="p-1 w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-lowest transition-colors disabled:opacity-50"
                        onClick={() => handleQty(tier.name, 1)}
                        disabled={tier.availableQuantity === 0 || (quantities[tier.name] || 0) >= tier.availableQuantity}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/15 flex justify-between items-end mb-8">
              <span className="font-retina text-on-surface-variant uppercase text-[10px] font-bold tracking-widest">Subtotal ({totalTickets})</span>
              <span className="font-mono text-2xl md:text-3xl font-bold text-on-surface">${subtotal.toFixed(2)}</span>
            </div>

            <Button
              className="w-full text-base md:text-lg py-4 flex items-center justify-center gap-2 rounded-xl"
              onClick={handleSecureTickets}
              disabled={totalTickets === 0 || addingToCart}
            >
              {addingToCart ? 'RESERVING...' : <>SECURE MY TICKETS <ArrowRight size={20} /></>}
            </Button>

            <div className="mt-6 bg-tertiary-container/10 p-4 rounded-xl text-tertiary-container text-xs flex gap-3 items-start">
              <div className="bg-tertiary-container p-1 rounded mt-0.5 shrink-0 text-white">
                 <TrendingUp size={12} />
              </div>
              <div>
                 <span className="block font-bold mb-1 uppercase tracking-widest text-[10px]">Demand Alert</span>
                 <span className="font-retina leading-relaxed text-on-surface">Over 1,000 people viewing. Complete purchase quickly.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
