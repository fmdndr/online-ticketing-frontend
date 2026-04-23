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

  // Create event modal
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

      {/* Hero */}
      <div className="mb-4">
        <h2 className="fw-black mb-1">Sales Velocity</h2>
        <p className="text-secondary small mb-0">Real-time throughput monitoring for live event distribution channels.</p>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="card text-center h-100">
            <div className="card-body py-3">
              <div className="rounded-2 p-2 d-inline-flex mb-2" style={{ background: 'var(--accent-green)' }}>
                <DollarSign size={18} className="text-white" />
              </div>
              <p className="text-secondary mb-1" style={{ fontSize: '0.58rem', letterSpacing: '0.8px', fontWeight: 600 }}>TOTAL REVENUE</p>
              <p className="fw-black mb-0 fs-6">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card text-center h-100">
            <div className="card-body py-3">
              <div className="rounded-2 p-2 d-inline-flex mb-2 bg-primary">
                <Ticket size={18} className="text-white" />
              </div>
              <p className="text-secondary mb-1" style={{ fontSize: '0.58rem', letterSpacing: '0.8px', fontWeight: 600 }}>TRANSACTIONS</p>
              <p className="fw-black mb-0 fs-6">{totalTransactions}</p>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card text-center h-100">
            <div className="card-body py-3">
              <div className="rounded-2 p-2 d-inline-flex mb-2" style={{ background: '#7C3AED' }}>
                <Activity size={18} className="text-white" />
              </div>
              <p className="text-secondary mb-1" style={{ fontSize: '0.58rem', letterSpacing: '0.8px', fontWeight: 600 }}>EVENTS LIVE</p>
              <p className="fw-black mb-0 fs-6">{events.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Peak side by side */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center gap-2">
              <TrendingUp size={15} />
              <h6 className="mb-0 fw-bold">Transaction Trends</h6>
            </div>
            <div className="card-body">
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
                    contentStyle={{ background: '#0F0F1A', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ color: '#A78BFA' }}
                    labelStyle={{ color: '#9CA3AF', fontSize: '10px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 text-white" style={{ background: 'var(--gradient-peak)' }}>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold text-white mb-1">Peak Intensity</h6>
                <p className="small mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>Success rate for processed transactions.</p>
              </div>
              <div>
                <div className="mb-2">
                  <span className="fw-black" style={{ fontSize: '3rem', letterSpacing: '-1px' }}>{successRate}%</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <ArrowUpRight size={14} />
                  <small className="fw-semibold" style={{ letterSpacing: '0.8px' }}>{completedPayments} OF {totalTransactions} COMPLETED</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Management */}
      <div className="card mb-4" id="event-management">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">Event Management</h6>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => setShowCreateModal(true)}
            id="create-event-btn"
          >
            <Plus size={14} /> New Event
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center gap-2 py-4 text-secondary">
              <Loader size={18} className="spin-icon" />
              <small>Loading events...</small>
            </div>
          ) : error ? (
            <div className="d-flex align-items-center gap-2 p-3 text-danger">
              <AlertCircle size={15} />
              <small>{error}</small>
            </div>
          ) : events.length === 0 ? (
            <p className="text-secondary text-center small py-4 mb-0">No events yet. Create your first event!</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-3 small fw-semibold">EVENT</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">VENUE</th>
                    <th className="small fw-semibold d-none d-md-table-cell">CATEGORY</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">TICKETS</th>
                    <th className="pe-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} id={`manage-event-${event.id}`}>
                      <td className="ps-3 fw-semibold small">{event.name}</td>
                      <td className="small text-secondary d-none d-sm-table-cell">{event.venue}</td>
                      <td className="small text-secondary d-none d-md-table-cell">{event.category}</td>
                      <td className="small text-secondary d-none d-sm-table-cell">
                        {event.ticketTypes?.length || 0} type{event.ticketTypes?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="text-end pe-3">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          title="Delete event"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ledger */}
      <div className="card mb-4" id="ledger-activity">
        <div className="card-header">
          <h6 className="mb-0 fw-bold">Recent Ledger Activity</h6>
        </div>
        <div className="card-body p-0">
          {payments.length === 0 ? (
            <p className="text-secondary text-center small py-4 mb-0">No transactions yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-3 small fw-semibold">ORDER ID</th>
                    <th className="small fw-semibold d-none d-sm-table-cell">DATE</th>
                    <th className="small fw-semibold text-end pe-3">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((payment, index) => (
                    <tr key={payment.id || index} className="animate-slide-in" style={{ animationDelay: `${index * 0.06}s` }} id={`tx-row-${index}`}>
                      <td className="ps-3 small" style={{ fontFamily: 'monospace' }}>
                        {payment.orderId ? payment.orderId.substring(0, 13) + '...' : '-'}
                      </td>
                      <td className="small text-secondary d-none d-sm-table-cell">{formatDate(payment.createdAt)}</td>
                      <td className="text-end pe-3">
                        <span className={`badge ${
                          payment.status === 2 || payment.status === 'Completed' ? 'bg-success' :
                          payment.status === 3 || payment.status === 'Failed' ? 'bg-danger' : 'bg-warning text-dark'
                        }`}>
                          ${(payment.totalAmount || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <>
          <div
            className="modal show d-block"
            tabIndex="-1"
            role="dialog"
            id="create-event-modal"
            style={{ zIndex: 1055 }}
            data-bs-theme="dark"
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title fw-semibold">Create New Event</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => setShowCreateModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small text-uppercase text-secondary">Event Name</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Rock Festival 2026"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase text-secondary">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Event description..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-uppercase text-secondary">Category</label>
                      <select
                        className="form-select"
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
                    <div className="col-6">
                      <label className="form-label small text-uppercase text-secondary">Date &amp; Time</label>
                      <DatePicker
                        selected={newEvent.date}
                        onChange={(date) => setNewEvent((prev) => ({ ...prev, date }))}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="MMM d, yyyy HH:mm"
                        placeholderText="Select date &amp; time"
                        minDate={new Date()}
                        className="form-control"
                        wrapperClassName="w-100"
                        popperClassName="datepicker-dark"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase text-secondary">Venue</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Central Park Arena, Istanbul"
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, venue: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-uppercase text-secondary">Image URL</label>
                    <input
                      className="form-control"
                      placeholder="https://picsum.photos/seed/event/800/400"
                      value={newEvent.imageUrl}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    />
                  </div>

                  {/* Ticket Types */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small text-uppercase text-secondary mb-0">Ticket Types</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        onClick={addTicketType}
                      >
                        <Plus size={13} /> Add Tier
                      </button>
                    </div>

                    {newEvent.ticketTypes.map((tier, i) => (
                      <div key={i} className="row g-2 mb-2 align-items-center">
                        <div className="col">
                          <input
                            className="form-control form-control-sm"
                            placeholder="Name"
                            value={tier.name}
                            onChange={(e) => updateTicketType(i, 'name', e.target.value)}
                          />
                        </div>
                        <div className="col-3">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Price"
                            value={tier.price}
                            onChange={(e) => updateTicketType(i, 'price', e.target.value)}
                          />
                        </div>
                        <div className="col-3">
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Qty"
                            value={tier.availableQuantity}
                            onChange={(e) => updateTicketType(i, 'availableQuantity', e.target.value)}
                          />
                        </div>
                        {newEvent.ticketTypes.length > 1 && (
                          <div className="col-auto">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeTicketType(i)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateEvent}
                    disabled={creating || !newEvent.name || !newEvent.venue || !newEvent.date}
                  >
                    {creating ? (
                      <>
                        <Loader size={15} className="spin-icon me-1" /> Creating...
                      </>
                    ) : (
                      'Create Event'
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{ zIndex: 1054 }} />
        </>
      )}
    </div>
  );
}
