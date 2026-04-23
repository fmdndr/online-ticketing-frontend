import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, Calendar, MapPin, Download, 
  Wallet, CalendarPlus, QrCode, ArrowLeft, Shield
} from 'lucide-react';
import { getPaymentByOrderId, getEventById } from '../services/api';
import { EventGridSkeleton } from '../components/States/LoadingState';
import { ErrorState } from '../components/States/ErrorState';
import heroBanner from '../assets/images/event_hero_banner.png';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const paymentData = await getPaymentByOrderId(id);
        if (!paymentData) throw new Error('Order not found');
        setPayment(paymentData);

        if (paymentData.eventId) {
          try {
            const eventData = await getEventById(paymentData.eventId);
            setEvent(eventData);
          } catch (e) {
            console.warn("Could not fetch event details", e);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12"><EventGridSkeleton /></div>;
  if (error) return <div className="max-w-6xl mx-auto px-6 py-12"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;
  if (!payment) return null;

  const eventName = event?.name || payment.ticketTypeName || 'Neon Overdrive Tour';
  const eventVenue = event?.venue || 'Madison Square Garden';
  const eventLocation = event?.location || 'New York City, NY';
  const eventImage = event?.imageUrl || heroBanner;
  
  // Format date
  const orderDate = new Date(payment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const eventDate = event?.date ? new Date(event.date) : new Date(Date.now() + 86400000 * 14); // default 2 weeks from now
  const formattedEventDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const tickets = Array.from({ length: payment.quantity || 1 }).map((_, i) => ({
    id: `TKT-${payment.orderId.substring(0, 4)}-${String.fromCharCode(65 + i)}`,
    section: payment.ticketTypeName.includes('VIP') ? 'VIP' : 'GA',
    row: payment.ticketTypeName.includes('VIP') ? 'Front' : 'G',
    seat: 12 + i
  }));

  const serviceFee = 35.00;
  const subtotal = payment.totalAmount - serviceFee;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Simple Top Navigation */}
        <div className="mb-8">
          <Link to="/orders" className="text-sm font-extrabold flex items-center gap-2 w-max transition-opacity hover:opacity-70" style={{ color: '#6f7173' }}>
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#10b981' }}>
              <CheckCircle size={28} style={{ color: '#191c1d' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: '#191c1d' }}>Order Confirmed</h1>
          </div>
          <p className="text-lg ml-[64px]" style={{ color: '#6f7173' }}>
            Your tickets are ready. We've also sent a copy to your email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column (Event & Tickets) */}
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            
            {/* Event Card */}
            <div className="rounded-2xl shadow-ambient overflow-hidden mb-10" style={{ backgroundColor: '#ffffff' }}>
              <div className="relative h-56 md:h-72 w-full" style={{ backgroundColor: '#100b29' }}>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${eventImage})`, opacity: 0.8 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
              </div>
              
              <div className="p-6 pt-0 relative z-10 -mt-20" style={{ backgroundColor: '#ffffff' }}>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm" style={{ backgroundColor: '#ffffff', color: '#3525cd', border: '1px solid #e3e4e5' }}>
                  Tour
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8" style={{ color: '#191c1d' }}>{eventName}</h2>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <Calendar className="shrink-0" size={24} style={{ color: '#6f7173' }} />
                    <div>
                      <div className="font-extrabold text-base mb-0.5" style={{ color: '#191c1d' }}>{formattedEventDate}</div>
                      <div className="text-sm" style={{ color: '#6f7173' }}>Doors open at 7:00 PM</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <MapPin className="shrink-0" size={24} style={{ color: '#6f7173' }} />
                    <div>
                      <div className="font-extrabold text-base mb-0.5" style={{ color: '#191c1d' }}>{eventVenue}</div>
                      <div className="text-sm" style={{ color: '#6f7173' }}>{eventLocation}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets Section */}
            <h3 className="text-2xl font-extrabold mb-6" style={{ color: '#191c1d' }}>Your Tickets</h3>
            
            <div className="space-y-4">
              {tickets.map((ticket, i) => (
                <div key={i} className="rounded-xl overflow-hidden flex flex-col sm:flex-row mb-4 shadow-sm" style={{ backgroundColor: '#f4f4f5' }}>
                  {/* Left Side: QR Code Area */}
                  <div className="w-full sm:w-[160px] shrink-0 flex flex-col items-center justify-center p-6 relative" style={{ backgroundColor: '#8b8b8b' }}>
                    <div className="w-16 h-16 border rounded flex items-center justify-center mb-3" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                      <QrCode size={32} style={{ color: '#ffffff', opacity: 0.5 }} />
                    </div>
                    <span className="text-[9px] font-extrabold tracking-widest uppercase" style={{ color: '#ffffff', opacity: 0.7 }}>Tap to enlarge</span>
                  </div>
                  
                  {/* Right Side: Ticket Details */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest" style={{ backgroundColor: ticket.section === 'VIP' ? '#c20038' : '#3525cd', color: '#ffffff' }}>
                        {ticket.section === 'VIP' ? 'VIP Entry' : 'GA Entry'}
                      </span>
                      <span className="font-mono text-sm" style={{ color: '#6f7173' }}>{ticket.id}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[10px] font-extrabold tracking-widest uppercase mb-1" style={{ color: '#6f7173' }}>Section</div>
                        <div className="text-lg font-extrabold" style={{ color: '#3525cd' }}>{ticket.section}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold tracking-widest uppercase mb-1" style={{ color: '#6f7173' }}>Row</div>
                        <div className="text-lg font-extrabold" style={{ color: '#3525cd' }}>{ticket.row}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold tracking-widest uppercase mb-1" style={{ color: '#6f7173' }}>Seat</div>
                        <div className="text-lg font-extrabold" style={{ color: '#191c1d' }}>{ticket.seat}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column (Ledger & Actions) */}
          <div className="lg:col-span-5 xl:col-span-4 w-full flex flex-col gap-4 lg:sticky lg:top-6">
            
            <div className="rounded-xl overflow-hidden shadow-ambient" style={{ backgroundColor: '#f4f4f5' }}>
              <div className="p-6 md:p-8">
                <h4 className="text-[11px] font-extrabold tracking-widest uppercase mb-8" style={{ color: '#6f7173' }}>Order Ledger</h4>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm" style={{ color: '#6f7173' }}>Order No.</span>
                  <span className="font-extrabold text-sm" style={{ color: '#191c1d' }}>{payment.orderId.substring(0, 8).toUpperCase()}Z</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm" style={{ color: '#6f7173' }}>Date</span>
                  <span className="text-sm" style={{ color: '#191c1d' }}>{orderDate}</span>
                </div>

                <div className="border-t border-dashed py-6 space-y-3 pb-0" style={{ borderColor: 'rgba(196, 199, 197, 0.6)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#191c1d' }}>{payment.quantity}x {payment.ticketTypeName}</span>
                    <span className="text-sm font-extrabold" style={{ color: '#191c1d' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#6f7173' }}>Service Fees</span>
                    <span className="text-sm" style={{ color: '#6f7173' }}>${serviceFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:px-8 md:py-6 flex justify-between items-center" style={{ backgroundColor: '#ffffff' }}>
                <span className="text-base font-extrabold" style={{ color: '#191c1d' }}>Total Paid</span>
                <span className="text-2xl font-extrabold" style={{ color: '#3525cd' }}>${payment.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button className="w-full font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-lg" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}>
                <Download size={18} /> Download PDF
              </button>
              <button className="w-full font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ backgroundColor: '#e3e4e5', color: '#191c1d' }}>
                <Wallet size={18} /> Add to Apple Wallet
              </button>
              <button className="w-full font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ backgroundColor: '#e3e4e5', color: '#191c1d' }}>
                <CalendarPlus size={18} /> Add to Calendar
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
