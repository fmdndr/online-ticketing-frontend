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
    } catch (err) {
      addToast('Failed to create event: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(id);
      fetchData();
    } catch (err) {
      addToast('Failed to delete event: ' + err.message);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Transaction Trends */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-ambient">
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
            <div className="mt-12">
              <div className="text-6xl md:text-7xl font-extrabold tracking-tight mb-4">{successRate}%</div>
              <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase text-on-primary/90">
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-extrabold tracking-widest uppercase">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {payments.slice(0, 10).map((payment, index) => (
                    <tr key={payment.id || index} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-primary">
                        TX-{payment.orderId ? payment.orderId.substring(0, 8).toUpperCase() : 'UNKNOWN'}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant hidden sm:table-cell">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-on-surface text-right">
                        ${(payment.totalAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden mb-8">
          <div className="p-6 md:p-8 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-extrabold text-on-surface text-lg">Event Management</h3>
            <button
              className="bg-primary hover:bg-primary-container text-on-primary font-extrabold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> New Event
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
              <table className="w-full text-left border-collapse">
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
                          className="text-error hover:text-error/80 p-2 rounded transition-colors"
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
            )}
          </div>
        </div>


      {showCreateModal && (
        <div className="fixed inset-0 z-[1055] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-ambient w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant/20">
            
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/30">
              <h5 className="text-xl font-extrabold text-on-surface">Create New Event</h5>
              <button
                type="button"
                className="text-on-surface-variant hover:text-on-surface transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Event Name</label>
                <input
                  className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="e.g. Rock Festival 2026"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Description</label>
                <textarea
                  className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  rows={3}
                  placeholder="Event description..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Category</label>
                  <select
                    className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
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
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Date &amp; Time</label>
                  <DatePicker
                    selected={newEvent.date}
                    onChange={(date) => setNewEvent((prev) => ({ ...prev, date }))}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy HH:mm"
                    placeholderText="Select date &amp; time"
                    minDate={new Date()}
                    className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Venue</label>
                <input
                  className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="e.g. Central Park Arena, Istanbul"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1">Image URL</label>
                <input
                  className="w-full bg-surface-container-highest border border-transparent rounded-lg p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="https://picsum.photos/seed/event/800/400"
                  value={newEvent.imageUrl}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Ticket Types</label>
                  <button
                    type="button"
                    className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    onClick={addTicketType}
                  >
                    <Plus size={14} /> Add Tier
                  </button>
                </div>

                {newEvent.ticketTypes.map((tier, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input
                      className="flex-1 bg-surface-container-highest border border-transparent rounded-lg p-2 text-sm text-on-surface outline-none"
                      placeholder="Name"
                      value={tier.name}
                      onChange={(e) => updateTicketType(i, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-24 bg-surface-container-highest border border-transparent rounded-lg p-2 text-sm text-on-surface outline-none"
                      placeholder="Price"
                      value={tier.price}
                      onChange={(e) => updateTicketType(i, 'price', e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-24 bg-surface-container-highest border border-transparent rounded-lg p-2 text-sm text-on-surface outline-none"
                      placeholder="Qty"
                      value={tier.availableQuantity}
                      onChange={(e) => updateTicketType(i, 'availableQuantity', e.target.value)}
                    />
                    {newEvent.ticketTypes.length > 1 && (
                      <button
                        type="button"
                        className="p-2 text-error hover:bg-error/10 rounded transition-colors"
                        onClick={() => removeTicketType(i)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg text-sm font-extrabold text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg text-sm font-extrabold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                onClick={handleCreateEvent}
                disabled={creating || !newEvent.name || !newEvent.venue || !newEvent.date}
              >
                {creating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" /> Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
