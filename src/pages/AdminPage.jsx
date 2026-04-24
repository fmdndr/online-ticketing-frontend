import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useToast } from '../components/Toast/useToast';
import { ToastContainer } from '../components/Toast/Toast';
import { TrendingUp, ArrowUpRight, Plus, Trash2, Edit3, X, Loader, AlertCircle, DollarSign, Ticket, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEvents, getPayments, createEvent, deleteEvent } from '../services/api';
import { trendChartData } from '../data/mockData';

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    category: 'Music',
    imageUrl: '',
    venue: '',
    date: null,
    ticketTypes: [{ name: 'Standard', price: 100, availableQuantity: 100 }],
  });

  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, paymentsData] = await Promise.all([
        getEvents().catch(() => []),
        getPayments().catch(() => []),
      ]);
      setEvents(eventsData || []);
      setPayments(paymentsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const totalRevenue = payments
    .filter((p) => p.status === 2 || p.status === 'Completed')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalTransactions = payments.length;
  const completedPayments = payments.filter((p) => p.status === 2 || p.status === 'Completed').length;
  const successRate = totalTransactions > 0 ? ((completedPayments / totalTransactions) * 100).toFixed(1) : '0.0';

  const paymentChartData = payments.length > 0
    ? (() => {
        const hourMap = {};
        payments.forEach((p) => {
          const date = new Date(p.createdAt);
          const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
          hourMap[hour] = (hourMap[hour] || 0) + 1;
        });
        return Object.entries(hourMap)
          .map(([time, value]) => ({ time, value }))
          .sort((a, b) => a.time.localeCompare(b.time));
      })()
    : trendChartData;

  const eventNameMap = {};
  events.forEach((e) => {
    eventNameMap[e.id] = e.name;
  });

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.venue || !newEvent.date) return;

    setCreating(true);
    try {
      await createEvent({
        ...newEvent,
        date: newEvent.date instanceof Date ? newEvent.date.toISOString() : new Date(newEvent.date).toISOString(),
        ticketTypes: newEvent.ticketTypes.map((t) => ({
          name: t.name,
          price: Number(t.price),
          availableQuantity: Number(t.availableQuantity),
        })),
      });
      setShowCreateModal(false);
      setNewEvent({
        name: '',
        description: '',
        category: 'Music',
        imageUrl: '',
        venue: '',
        date: null,
        ticketTypes: [{ name: 'Standard', price: 100, availableQuantity: 100 }],
      });
      fetchData();
      addToast('Event created successfully', 'success');
    } catch (err) {
      addToast('Failed to create event: ' + err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(id);
      fetchData();
      addToast('Event deleted successfully', 'success');
    } catch (err) {
      addToast('Failed to delete event: ' + err.message, 'error');
    }
  };

  const addTicketType = () => {
    setNewEvent((prev) => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { name: '', price: 0, availableQuantity: 0 }],
    }));
  };

  const updateTicketType = (index, field, value) => {
    setNewEvent((prev) => {
      const types = [...prev.ticketTypes];
      types[index] = { ...types[index], [field]: value };
      return { ...prev, ticketTypes: types };
    });
  };

  const removeTicketType = (index) => {
    setNewEvent((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="admin-page container-fluid py-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Sales Velocity</h1>
          <p className="text-on-surface-variant text-lg">Real-time throughput monitoring for live event distribution channels.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Transaction Trends */}
          <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-ambient">
            <h3 className="font-extrabold text-on-surface mb-6">Transaction Trends</h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e4e5" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6f7173', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#191c1d', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#4f46e5' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Intensity */}
          <div className="bg-primary rounded-2xl p-6 shadow-primary flex flex-col justify-between text-on-primary">
            <div>
              <h3 className="font-extrabold mb-1">Peak Intensity</h3>
              <p className="text-on-primary/70 text-sm">Maximum concurrent load handled today.</p>
            </div>
            <div className="mt-8 md:mt-12">
              <div className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">{successRate}%</div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest uppercase text-on-primary/90">
                <TrendingUp size={14} /> +12.4% FROM YESTERDAY
              </div>
            </div>
          </div>
        </div>


        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden mb-8">
          <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-extrabold text-on-surface text-lg">Recent Ledger Activity</h3>
          </div>
          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <p className="text-on-surface-variant text-center text-sm py-8">No transactions yet.</p>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block sm:hidden divide-y divide-outline-variant/20">
                  {payments.slice(0, 5).map((payment, index) => (
                    <div key={payment.id || index} className="p-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-primary">
                          TX-{payment.orderId ? payment.orderId.substring(0, 8).toUpperCase() : 'UNKNOWN'}
                        </span>
                        <span className="font-mono text-lg font-bold text-on-surface">
                          ${(payment.totalAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant font-medium">
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet/Desktop View: Table */}
                <table className="hidden sm:table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase">
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4 hidden md:table-cell">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {payments.slice(0, 10).map((payment, index) => (
                      <tr key={payment.id || index} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-primary">
                          TX-{payment.orderId ? payment.orderId.substring(0, 8).toUpperCase() : 'UNKNOWN'}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden md:table-cell">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm font-extrabold text-on-surface text-right">
                          ${(payment.totalAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden mb-8">
          <div className="p-6 md:p-8 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="font-extrabold text-on-surface text-lg uppercase tracking-tightest">Event Management</h3>
            <button
              className="bg-primary hover:bg-primary-container text-on-primary font-extrabold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-primary hover:scale-[1.02] active:scale-[0.98] text-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> NEW EVENT
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
                <Loader size={20} className="animate-spin" />
                <span className="text-sm font-bold">Loading events...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-6 text-error">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            ) : events.length === 0 ? (
              <p className="text-on-surface-variant text-center text-sm py-8">No events yet. Create your first event!</p>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block sm:hidden divide-y divide-outline-variant/20">
                  {events.map((event) => (
                    <div key={event.id} className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-on-surface truncate uppercase tracking-tight">{event.name}</h4>
                          <p className="text-xs text-on-surface-variant truncate">{event.venue}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {event.category}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface-variant">
                          {event.ticketTypes?.length || 0} TIERS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet/Desktop View: Table */}
                <table className="hidden sm:table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase">
                      <th className="px-6 py-4">Event</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Venue</th>
                      <th className="px-6 py-4 hidden md:table-cell">Category</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Tickets</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 font-bold text-sm text-on-surface">{event.name}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden sm:table-cell">{event.venue}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden md:table-cell">{event.category}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden sm:table-cell">
                          {event.ticketTypes?.length || 0} type{event.ticketTypes?.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="text-on-surface-variant hover:text-error hover:bg-error/10 p-2 rounded-lg transition-all"
                            onClick={() => handleDeleteEvent(event.id, event.name)}
                            title="Delete event"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {/* Modal Polish */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[1055] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-surface-container-low rounded-3xl shadow-ambient w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant/20">
              
              <div className="flex justify-between items-center p-6 border-b border-outline-variant/30">
                <h5 className="text-xl font-extrabold text-on-surface uppercase tracking-tightest">Create New Event</h5>
                <button
                  type="button"
                  className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-1 scrollbar-hide">
                <div className="mb-6">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Event Name</label>
                  <input
                    className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                    placeholder="e.g. Rock Festival 2026"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Description</label>
                  <textarea
                    className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Event details..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Category</label>
                    <select
                      className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all appearance-none"
                      value={newEvent.category}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Music">Music</option>
                      <option value="Technology">Technology</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Sports">Sports</option>
                      <option value="Theater">Theater</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Date &amp; Time</label>
                    <DatePicker
                      selected={newEvent.date}
                      onChange={(date) => setNewEvent((prev) => ({ ...prev, date }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMM d, yyyy HH:mm"
                      placeholderText="Select date &amp; time"
                      minDate={new Date()}
                      className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                      wrapperClassName="w-full"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Venue</label>
                  <input
                    className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                    placeholder="e.g. Central Park Arena, Istanbul"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Image URL</label>
                  <input
                    className="w-full bg-surface-container-highest border border-transparent rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                    placeholder="https://..."
                    value={newEvent.imageUrl}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase ml-1">Ticket Tiers</label>
                    <button
                      type="button"
                      className="text-[10px] font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1"
                      onClick={addTicketType}
                    >
                      <Plus size={12} /> ADD TIER
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newEvent.ticketTypes.map((tier, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-3 p-4 bg-surface-container-highest/50 rounded-2xl border border-outline-variant/10 relative group">
                        <input
                          className="flex-1 bg-transparent border-b border-outline-variant/30 py-2 text-sm text-on-surface font-bold focus:outline-none focus:border-primary transition-colors uppercase tracking-tight"
                          placeholder="Name"
                          value={tier.name}
                          onChange={(e) => updateTicketType(i, 'name', e.target.value)}
                        />
                        <div className="flex gap-3">
                          <div className="w-24">
                            <label className="text-[8px] font-bold text-on-surface-variant uppercase block mb-1">Price ($)</label>
                            <input
                              type="number"
                              className="w-full bg-transparent border-b border-outline-variant/30 py-1 text-sm text-on-surface font-mono outline-none"
                              value={tier.price}
                              onChange={(e) => updateTicketType(i, 'price', e.target.value)}
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[8px] font-bold text-on-surface-variant uppercase block mb-1">Qty</label>
                            <input
                              type="number"
                              className="w-full bg-transparent border-b border-outline-variant/30 py-1 text-sm text-on-surface font-mono outline-none"
                              value={tier.availableQuantity}
                              onChange={(e) => updateTicketType(i, 'availableQuantity', e.target.value)}
                            />
                          </div>
                          {newEvent.ticketTypes.length > 1 && (
                            <button
                              type="button"
                              className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors sm:mt-4"
                              onClick={() => removeTicketType(i)}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-low">
                <button
                  type="button"
                  className="px-6 py-3 rounded-2xl text-sm font-extrabold text-on-surface hover:bg-surface-container-high transition-colors uppercase tracking-tightest"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-8 py-3 rounded-2xl text-sm font-extrabold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all shadow-primary uppercase tracking-tightest"
                  onClick={handleCreateEvent}
                  disabled={creating || !newEvent.name || !newEvent.venue || !newEvent.date}
                >
                  {creating ? (
                    <>
                      <Loader size={16} className="animate-spin mr-2" /> CREATING...
                    </>
                  ) : (
                    'CREATE EVENT'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
