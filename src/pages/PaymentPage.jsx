import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, ChevronRight, Headphones, CheckCircle, Loader, ArrowLeft, Zap, Wifi } from 'lucide-react';
import { getBasket, checkout, getUserId } from '../services/api';
import { useToast } from '../components/Toast/useToast';
import { ToastContainer } from '../components/Toast/Toast';
import heroBanner from '../assets/images/event_hero_banner.png';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToast();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [timer, setTimer] = useState(292); // 04:52 starting time

  const [basketItems, setBasketItems] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null); // 'success' | 'error'
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const loadBasketData = useCallback(async () => {
    if (location.state?.items) {
      setBasketItems(location.state.items);
      setEventInfo(location.state.event);
      setTotalPrice(location.state.subtotal || 0);
      return;
    }
    try {
      const basket = await getBasket();
      if (basket?.items?.length > 0) {
        setBasketItems(basket.items);
        setTotalPrice(basket.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
      }
    } catch (_e) {
      void _e;
    }
  }, [location]);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      navigate('/login');
      return;
    }
    loadBasketData();
  }, [loadBasketData, navigate]);

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

  const serviceFee = totalPrice > 0 ? 18.50 : 0;
  const insuranceFee = totalPrice > 0 ? 12.00 : 0;
  const grandTotal = totalPrice + serviceFee + insuranceFee;

  const handleCheckout = async () => {
    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      addToast('Please fill in all payment fields.', 'warning');
      return;
    }

    const expiryClean = expiry.replace(/\D/g, '');
    if (expiryClean.length !== 4) {
      addToast('Invalid expiry date format. Please use MM / YY.', 'warning');
      return;
    }

    const month = parseInt(expiryClean.substring(0, 2), 10);
    const year = parseInt(expiryClean.substring(2, 4), 10) + 2000;

    if (month < 1 || month > 12) {
      addToast('Invalid expiry month.', 'warning');
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      addToast('Your card has expired. Please use a valid card.', 'warning');
      return;
    }

    setProcessing(true);
    setCheckoutResult(null);
    setCheckoutMessage('');

    try {
      await checkout({
        userId: getUserId(),
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

  const txId = `KMTC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}X`;
  const eventName = eventInfo?.name || basketItems[0]?.eventName || 'NEON OVERDRIVE 2024';
  const eventVenue = eventInfo?.venue || 'Sector 7 Convention Hall, Neo Tokyo';
  const eventImage = eventInfo?.imageUrl || heroBanner;
  const backTo = eventInfo?.id ? `/event/${eventInfo.id}` : '/';

  return (
    <div className="min-h-screen bg-surface pt-[72px]">
      <ToastContainer toasts={toasts} onRemove={removeToast} />


      {checkoutResult === 'success' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-ambient max-w-md w-full text-center border border-outline-variant/10">
            <CheckCircle size={56} className="text-secondary mx-auto mb-4" />
            <h4 className="text-2xl font-black text-on-surface mb-2">Payment Confirmed!</h4>
            <p className="text-on-surface-variant text-sm mb-6">{checkoutMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/orders" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                View My Orders
              </Link>
              <Link to="/" className="bg-surface-container-low hover:bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-lg transition-colors">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

        <div className="flex justify-between items-center mb-8 md:mb-12">
          <div className="font-black text-primary text-lg tracking-tight uppercase flex items-center gap-2 leading-tight">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white shrink-0">
              <Shield size={14} />
            </div>
            <div>SOCRATIC<br />EVENT</div>
          </div>
          <Link to={backTo} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={14} /> Back to Event
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-[1.1] tracking-tightest mb-4">
                COMPLETE SECURE<br />PAYMENT
              </h1>
              <p className="text-on-surface-variant text-sm md:text-base font-retina max-w-sm">
                Review your transaction and finalize the ledger entry.
              </p>
            </div>


            <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-ambient border border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-primary font-bold text-lg uppercase tracking-tight">Credit or Debit Card</h3>
                <div className="flex gap-2.5 text-on-surface-variant/70">
                  <CreditCard size={20} />
                  <Wifi size={20} />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-primary tracking-widest uppercase mb-1.5 ml-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="ALEXANDER KINETIC"
                    className="w-full bg-surface-container-low border border-transparent rounded-xl p-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-on-surface-variant/50 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-primary tracking-widest uppercase mb-1.5 ml-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-surface-container-low border border-transparent rounded-xl p-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-on-surface-variant/50 transition-all outline-none"
                    />
                    <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-primary tracking-widest uppercase mb-1.5 ml-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={7}
                      placeholder="MM / YY"
                      className="w-full bg-surface-container-low border border-transparent rounded-xl p-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-on-surface-variant/50 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-primary tracking-widest uppercase mb-1.5 ml-1">CVC / CVV</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      placeholder="123"
                      className="w-full bg-surface-container-low border border-transparent rounded-xl p-4 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 placeholder:text-on-surface-variant/50 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-low cursor-pointer"
                  />
                  <label htmlFor="saveCard" className="text-xs text-on-surface-variant leading-relaxed cursor-pointer select-none">
                    Save card details for future high-velocity events
                  </label>
                </div>
              </div>
            </div>
          </div>


          <div className="lg:col-span-5 flex flex-col gap-6">

            <div className="relative bg-[#100b29] rounded-2xl overflow-hidden p-6 md:p-8 text-white shadow-ambient shrink-0">
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: `url(${eventImage})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100b29] via-[#100b29]/80 to-transparent" />

              <div className="relative z-10 flex flex-col justify-end min-h-[140px]">
                <span className="bg-secondary text-white text-[9px] font-bold px-2.5 py-1 rounded-full w-max tracking-widest mb-3 shadow-ambient">
                  {checkoutResult === 'success' ? 'CONFIRMED' : 'RESERVED'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black uppercase leading-[1.1] mb-1.5">{eventName}</h2>
                <p className="text-xs text-white/70">{eventVenue}</p>

                <div className="absolute right-0 bottom-0 text-right">
                  <div className="text-[9px] font-bold tracking-widest text-white/50 mb-0.5">TIME LEFT</div>
                  <div className="font-mono text-xl font-bold">{formatTimer(timer)}</div>
                </div>
              </div>
            </div>


            <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-ambient shrink-0 border border-outline-variant/10">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-5">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Transaction ID</span>
                <span className="font-mono text-[11px] font-medium text-on-surface-variant">{txId}</span>
              </div>

              <div className="space-y-4 mb-6">
                {basketItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-[13px] text-on-surface mb-0.5 uppercase tracking-tight">{item.ticketTypeName}</div>
                      <div className="text-[11px] text-on-surface-variant">Qty {item.quantity} • {item.eventName}</div>
                    </div>
                    <div className="font-bold text-primary text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                {basketItems.length === 0 && (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-[13px] text-on-surface mb-0.5 uppercase tracking-tight">Basket Empty</div>
                      <div className="text-[11px] text-on-surface-variant">No items selected</div>
                    </div>
                    <div className="font-bold text-primary text-sm">$0.00</div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-on-surface-variant">Facility & Processing Fee</span>
                  <span className="font-bold text-xs text-on-surface">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Insurance (Protection Plan)</span>
                  <span className="font-bold text-xs text-on-surface">${insuranceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-surface-container-low -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-2xl border-t border-outline-variant/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Payable</div>
                    <div className="text-3xl font-black text-on-surface">${grandTotal.toFixed(2)}</div>
                  </div>
                  <div className="bg-primary/10 text-primary font-bold text-[9px] px-2 py-1 rounded tracking-wider mt-1 uppercase">USD</div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing || basketItems.length === 0}
                  className="w-full bg-[#056f4a] hover:bg-[#045c3d] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-[#056f4a]/20 uppercase tracking-widest"
                >
                  {processing ? <Loader className="animate-spin" size={18} /> : 'PAY NOW'}
                  {!processing && <ChevronRight size={18} />}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-5 text-on-surface-variant/70">
                  <Shield size={12} />
                  <span className="text-[9px] font-bold tracking-widest uppercase">256-Bit SSL Secured Ledger</span>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4 mb-10 shrink-0">
              <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 shadow-ambient border border-outline-variant/5">
                <div className="bg-[#e2ffe9] text-[#056f4a] p-2.5 rounded-lg">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Instant</div>
                  <div className="text-xs font-black text-on-surface">Delivery</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3 shadow-ambient border border-outline-variant/5">
                <div className="bg-[#ede9ff] text-primary p-2.5 rounded-lg">
                  <Headphones size={18} />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Priority</div>
                  <div className="text-xs font-black text-on-surface">Concierge</div>
                </div>
              </div>
            </div>


            <div className="text-center mt-auto pb-6">
              <div className="flex justify-center gap-4 sm:gap-6 mb-4">
                <a href="#" className="text-[9px] sm:text-[10px] text-on-surface-variant hover:text-primary transition-colors">Terms of Sale</a>
                <a href="#" className="text-[9px] sm:text-[10px] text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="text-[9px] sm:text-[10px] text-on-surface-variant hover:text-primary transition-colors">Anti-Scalper</a>
              </div>
              <div className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest">
                © 2024 SOCRATIC EVENT TICKETING
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
