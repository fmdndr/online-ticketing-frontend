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
    <div className="events-page container">
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

      {/* Loading State */}
      {loading && (
        <div className="events-loading" id="events-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="event-skeleton">
              <div className="event-skeleton__image shimmer" />
              <div className="event-skeleton__info">
                <div className="event-skeleton__title shimmer" />
                <div className="event-skeleton__venue shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="events-error" id="events-error">
          <div className="events-error__icon">
            <AlertCircle size={28} />
          </div>
          <h3 className="events-error__title">Unable to Load Events</h3>
          <p className="events-error__text">{error}</p>
          <button className="btn btn-outline events-error__btn" onClick={fetchEvents}>
            Try Again
          </button>
        </div>
      )}

      {/* Event Cards */}
      {!loading && !error && (
        <section className="events-list" id="events-list">
          {filteredEvents.length === 0 && (
            <div className="events-empty">
              <p>No events found matching your criteria.</p>
            </div>
          )}
          {filteredEvents.map((event, index) => (
            <Link
              to={`/event/${event.id}`}
              key={event.id}
              className="event-card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.08}s` }}
              id={`event-card-${event.id}`}
            >
              <div className="event-card__image-wrap">
                <img
                  src={event.imageUrl || '/placeholder-event.jpg'}
                  alt={event.name}
                  className="event-card__image"
                  onError={(e) => {
                    e.target.style.background = 'var(--gradient-primary)';
                    e.target.style.minHeight = '180px';
                  }}
                />
                {isSoldOut(event.ticketTypes) ? (
                  <span className="event-card__badge event-card__badge--soldout">SOLD OUT</span>
                ) : getMinPrice(event.ticketTypes) ? (
                  <span className="event-card__badge event-card__badge--price">{getMinPrice(event.ticketTypes)}</span>
                ) : null}
              </div>
              <div className="event-card__info">
                <div className="event-card__details">
                  <h3 className="event-card__title">{event.name?.toUpperCase()}</h3>
                  <div className="event-card__venue">
                    <MapPin size={12} />
                    <span>{event.venue}</span>
                  </div>
                </div>
                <div className="event-card__date">
                  <span className="event-card__date-text">{formatDate(event.date)}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Discover More Section */}
      <section className="discover-section" id="discover-section">
        <div className="discover-section__image-wrap">
          <img src={discoverCurtain} alt="Discover more events" className="discover-section__image" />
        </div>
        <h2 className="discover-section__title">DISCOVER MORE EVENTS</h2>
        <p className="discover-section__text">
          Explore thousands of live events across music, sports, and arts. New tickets released daily.
        </p>
        <button className="btn btn-outline discover-section__btn" id="load-more-btn">
          Load More
        </button>
      </section>

      {/* FAB */}
      <button className="events-fab" id="events-fab">
        <Plus size={24} />
      </button>
    </div>
  );
}
