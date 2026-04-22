import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, Plus, Trash2, Edit3, X, Loader, AlertCircle, DollarSign, Ticket, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEvents, getPayments, createEvent, deleteEvent } from '../services/api';
import { trendChartData } from '../data/mockData';
import './AdminPage.css';

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create event modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    category: 'Music',
    imageUrl: '',
    venue: '',
    date: '',
    ticketTypes: [{ name: 'Standard', price: 100, availableQuantity: 100 }],
  });

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

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  // Stats from real data
  const totalRevenue = payments
    .filter((p) => p.status === 2 || p.status === 'Completed')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalTransactions = payments.length;
  const completedPayments = payments.filter((p) => p.status === 2 || p.status === 'Completed').length;
  const successRate = totalTransactions > 0 ? ((completedPayments / totalTransactions) * 100).toFixed(1) : '0.0';

  // Build chart from payment timestamps
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

  // Event name lookup for payments
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
        date: new Date(newEvent.date).toISOString(),
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
        date: '',
        ticketTypes: [{ name: 'Standard', price: 100, availableQuantity: 100 }],
      });
      fetchData();
    } catch (err) {
      alert('Failed to create event: ' + err.message);
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
      alert('Failed to delete event: ' + err.message);
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
    <div className="admin-page container">
      {/* Sales Velocity Hero */}
      <section className="admin-hero" id="admin-hero">
        <h1 className="admin-hero__title">Sales Velocity</h1>
        <p className="admin-hero__desc">
          Real-time throughput monitoring for live event distribution channels.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="admin-stats" id="admin-stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">
            <DollarSign size={18} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">TOTAL REVENUE</span>
            <span className="stat-card__value">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <Ticket size={18} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">TRANSACTIONS</span>
            <span className="stat-card__value">{totalTransactions}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">
            <Activity size={18} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">EVENTS LIVE</span>
            <span className="stat-card__value">{events.length}</span>
          </div>
        </div>
      </section>

      {/* Transaction Trends Chart */}
      <section className="trends-section card" id="trends-chart">
        <h3 className="trends-section__title">Transaction Trends</h3>
        <div className="trends-section__chart">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={paymentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                interval={2}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#0F0F1A',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                itemStyle={{ color: '#A78BFA' }}
                labelStyle={{ color: '#9CA3AF', fontSize: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Peak Intensity */}
      <section className="peak-section" id="peak-intensity">
        <div className="peak-card">
          <h3 className="peak-card__title">Peak Intensity</h3>
          <p className="peak-card__desc">Success rate for processed transactions.</p>
          <div className="peak-card__stat animate-fade-in-up">
            <span className="peak-card__value">{successRate}%</span>
          </div>
          <div className="peak-card__change">
            <ArrowUpRight size={14} />
            <span>{completedPayments} OF {totalTransactions} COMPLETED</span>
          </div>
        </div>
      </section>

      {/* Event Management */}
      <section className="event-management card" id="event-management">
        <div className="event-management__header">
          <h3 className="event-management__title">Event Management</h3>
          <button
            className="btn btn-primary event-management__add-btn"
            onClick={() => setShowCreateModal(true)}
            id="create-event-btn"
          >
            <Plus size={16} /> New Event
          </button>
        </div>

        {loading ? (
          <div className="event-management__loading">
            <Loader size={20} className="spin-icon" />
            <span>Loading events...</span>
          </div>
        ) : error ? (
          <div className="event-management__error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="event-management__empty">
            <p>No events found. Create your first event!</p>
          </div>
        ) : (
          <div className="event-management__list">
            {events.map((event) => (
              <div key={event.id} className="event-management__item" id={`manage-event-${event.id}`}>
                <div className="event-management__item-info">
                  <strong className="event-management__item-name">{event.name}</strong>
                  <span className="event-management__item-meta">
                    {event.venue} • {event.category}
                  </span>
                  <span className="event-management__item-tickets">
                    {event.ticketTypes?.length || 0} ticket type{event.ticketTypes?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="event-management__item-actions">
                  <button
                    className="event-management__action-btn event-management__action-btn--delete"
                    onClick={() => handleDeleteEvent(event.id, event.name)}
                    title="Delete event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Ledger Activity */}
      <section className="ledger-section card" id="ledger-activity">
        <h3 className="ledger-section__title">Recent Ledger Activity</h3>
        
        {payments.length === 0 ? (
          <div className="ledger-section__empty">
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="ledger-table">
            <div className="ledger-table__header">
              <span className="ledger-table__th ledger-table__th--id">ORDER ID</span>
              <span className="ledger-table__th ledger-table__th--date">DATE</span>
              <span className="ledger-table__th ledger-table__th--event">AMOUNT</span>
            </div>
            
            {payments.slice(0, 10).map((payment, index) => (
              <div
                key={payment.id || index}
                className="ledger-table__row animate-slide-in"
                style={{ animationDelay: `${index * 0.06}s` }}
                id={`tx-row-${index}`}
              >
                <span className="ledger-table__td ledger-table__td--id">
                  {payment.orderId ? payment.orderId.substring(0, 13) + '...' : '-'}
                </span>
                <span className="ledger-table__td ledger-table__td--date">
                  {formatDate(payment.createdAt)}
                </span>
                <span className="ledger-table__td ledger-table__td--event">
                  <span className={`ledger-table__status ledger-table__status--${
                    payment.status === 2 || payment.status === 'Completed' ? 'success' :
                    payment.status === 3 || payment.status === 'Failed' ? 'failed' : 'pending'
                  }`}>
                    ${(payment.totalAmount || 0).toFixed(2)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" id="create-event-modal">
          <div className="modal card">
            <div className="modal__header">
              <h3 className="modal__title">Create New Event</h3>
              <button className="modal__close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal__body">
              <div className="modal__field">
                <label className="modal__label">EVENT NAME</label>
                <input
                  className="modal__input"
                  placeholder="e.g. Rock Festival 2026"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="modal__field">
                <label className="modal__label">DESCRIPTION</label>
                <textarea
                  className="modal__input modal__textarea"
                  placeholder="Event description..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="modal__row">
                <div className="modal__field modal__field--half">
                  <label className="modal__label">CATEGORY</label>
                  <select
                    className="modal__input"
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
                <div className="modal__field modal__field--half">
                  <label className="modal__label">DATE</label>
                  <input
                    type="datetime-local"
                    className="modal__input"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal__field">
                <label className="modal__label">VENUE</label>
                <input
                  className="modal__input"
                  placeholder="e.g. Central Park Arena, Istanbul"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
                />
              </div>

              <div className="modal__field">
                <label className="modal__label">IMAGE URL</label>
                <input
                  className="modal__input"
                  placeholder="https://picsum.photos/seed/event/800/400"
                  value={newEvent.imageUrl}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              {/* Ticket Types */}
              <div className="modal__field">
                <div className="modal__label-row">
                  <label className="modal__label">TICKET TYPES</label>
                  <button className="modal__add-tier" onClick={addTicketType}>
                    <Plus size={14} /> Add Tier
                  </button>
                </div>

                {newEvent.ticketTypes.map((tier, i) => (
                  <div key={i} className="modal__tier-row">
                    <input
                      className="modal__input modal__input--sm"
                      placeholder="Name"
                      value={tier.name}
                      onChange={(e) => updateTicketType(i, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="modal__input modal__input--sm"
                      placeholder="Price"
                      value={tier.price}
                      onChange={(e) => updateTicketType(i, 'price', e.target.value)}
                    />
                    <input
                      type="number"
                      className="modal__input modal__input--sm"
                      placeholder="Qty"
                      value={tier.availableQuantity}
                      onChange={(e) => updateTicketType(i, 'availableQuantity', e.target.value)}
                    />
                    {newEvent.ticketTypes.length > 1 && (
                      <button className="modal__remove-tier" onClick={() => removeTicketType(i)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateEvent}
                disabled={creating || !newEvent.name || !newEvent.venue || !newEvent.date}
              >
                {creating ? (
                  <>
                    <Loader size={16} className="spin-icon" /> Creating...
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
