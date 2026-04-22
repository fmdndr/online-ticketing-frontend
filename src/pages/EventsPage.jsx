import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Plus, User, Bell, Loader, AlertCircle } from 'lucide-react';
import { getEvents } from '../services/api';
import discoverCurtain from '../assets/images/discover_curtain.png';
import './EventsPage.css';

const defaultCategories = ['All Events', 'Music', 'Technology', 'Entertainment', 'Sports', 'Theater'];

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents();
      setEvents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Build dynamic category list from API data
  const categories = [...new Set(events.map((e) => e.category))];
  const allCategories = ['All Events', ...categories.filter((c) => !defaultCategories.includes(c)), ...defaultCategories.slice(1)];
  const uniqueCategories = [...new Set(allCategories)];

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      activeCategory === 'All Events' ||
      event.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format date from ISO string
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
  };

  // Get lowest ticket price
  const getMinPrice = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return null;
    const min = Math.min(...ticketTypes.map((t) => t.price));
    return `From $${min.toFixed(0)}`;
  };

  // Check if all tickets are sold out
  const isSoldOut = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return false;
    return ticketTypes.every((t) => t.availableQuantity === 0);
  };

  return (
    <div className="events-page container-fluid">
      {/* Hero Section */}
      <section className="events-hero" id="events-hero">
        <div className="events-hero__top">
          <h1 className="events-hero__title">
            LIVE<br />EXPERIENCES
          </h1>
          <div className="events-hero__avatars">
            <button className="events-hero__avatar-btn">
              <Bell size={18} />
            </button>
            <div className="events-hero__avatar">
              <User size={16} />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="events-search" id="events-search">
          <Search size={16} className="events-search__icon" />
          <input
            type="text"
            placeholder="Search artists, venues, or cities..."
            className="events-search__input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-input"
          />
        </div>

        {/* Category Filters */}
        <div className="events-categories" id="events-categories">
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              className={`events-categories__pill ${
                activeCategory === cat ? 'events-categories__pill--active' : ''
              }`}
              onClick={() => setActiveCategory(cat)}
              id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 mb-4" id="events-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col">
              <div className="card h-100">
                <div className="placeholder-glow">
                  <div className="placeholder w-100" style={{ height: '180px', borderRadius: 'var(--bs-card-inner-border-radius) var(--bs-card-inner-border-radius) 0 0' }} />
                </div>
                <div className="card-body"><div className="placeholder-glow"><span className="placeholder col-8 d-block mb-2"></span><span className="placeholder col-5 d-block"></span></div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger d-flex align-items-center gap-3 my-3" role="alert" id="events-error">
          <AlertCircle size={22} className="flex-shrink-0" />
          <div className="flex-grow-1">{error}</div>
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      )}

      {/* Event Cards */}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 && (
            <div className="text-center py-5"><p className="text-secondary">No events found matching your criteria.</p></div>
          )}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 mb-4" id="events-list">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="col">
                <Link to={`/event/${event.id}`} className="text-decoration-none" id={`event-card-${event.id}`}>
                  <div className="card h-100 animate-fade-in-up" style={{ animationDelay: `${index * 0.08}s` }}>
                    <div className="position-relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={event.imageUrl || '/placeholder-event.jpg'}
                        alt={event.name}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        onError={(e) => { e.target.style.background = 'var(--gradient-primary)'; e.target.style.minHeight = '180px'; }}
                      />
                      {isSoldOut(event.ticketTypes) ? (
                        <span className="position-absolute top-0 start-0 m-2 badge bg-danger">SOLD OUT</span>
                      ) : getMinPrice(event.ticketTypes) ? (
                        <span className="position-absolute top-0 start-0 m-2 badge bg-primary">{getMinPrice(event.ticketTypes)}</span>
                      ) : null}
                    </div>
                    <div className="card-body pb-2">
                      <h6 className="card-title fw-bold small mb-1">{event.name?.toUpperCase()}</h6>
                      <div className="d-flex align-items-center gap-1 text-secondary">
                        <MapPin size={11} />
                        <small className="text-truncate">{event.venue}</small>
                      </div>
                    </div>
                    <div className="card-footer d-flex justify-content-end py-2">
                      <span className="badge bg-primary">{formatDate(event.date)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Discover More */}
      <div className="card mb-4 overflow-hidden" id="discover-section">
        <img src={discoverCurtain} alt="Discover more events" className="card-img" style={{ height: '200px', objectFit: 'cover', opacity: 0.7 }} />
        <div className="card-img-overlay d-flex flex-column justify-content-center text-white">
          <h3 className="fw-black mb-2">DISCOVER MORE EVENTS</h3>
          <p className="small mb-0">Explore thousands of live events across music, sports, and arts. New tickets released daily.</p>
          <div className="mt-3">
            <button className="btn btn-light btn-sm" id="load-more-btn">Load More</button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="events-fab" id="events-fab">
        <Plus size={24} />
      </button>
    </div>
  );
}
