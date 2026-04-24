import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getEvents } from '../services/api';
import discoverCurtain from '../assets/images/discover_curtain.png';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { EventGridSkeleton } from '../components/States/LoadingState';
import { EmptyState } from '../components/States/EmptyState';
import { ErrorState } from '../components/States/ErrorState';

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
  };

  const isSoldOut = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return false;
    return ticketTypes.every((t) => t.availableQuantity === 0);
  };

  return (
    <div className="min-h-screen bg-surface pb-16">

      <main className="max-w-7xl mx-auto px-6 pt-12 md:pt-20">


        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tightest text-on-surface max-w-2xl leading-tight uppercase">
            LIVE <br/> EXPERIENCES
          </h1>
          <div className="text-left md:text-right w-full md:w-auto">
             <div className="relative mb-4 md:mb-0">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                 <Search size={18} />
               </span>
               <input
                 type="text"
                 placeholder="Search artists, venues, or cities..."
                 className="w-full md:w-80 pl-10 pr-4 py-3 bg-surface-container-high rounded text-on-surface placeholder-on-surface-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-[2px] focus:ring-primary/20 transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
        </div>


        <div className="flex flex-nowrap md:flex-wrap gap-2 mb-12 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold tracking-wider transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>


        {loading && <EventGridSkeleton />}

        {error && !loading && (
          <div className="flex justify-center my-12">
            <ErrorState message={error} onRetry={fetchEvents} />
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <EmptyState message="No events found matching your criteria." />
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 mb-16">
              {filteredEvents.map((event) => (
                <Link to={`/event/${event.id}`} key={event.id} className="group flex flex-col p-4 -m-4 rounded hover:bg-surface-container-high transition-colors cursor-pointer outline-none focus:ring-[2px] focus:ring-primary/20">

                  <div className="aspect-[4/3] bg-surface-container-lowest rounded overflow-hidden mb-4 md:mb-6 relative shadow-ambient">
                     <img
                        src={event.imageUrl || '/placeholder-event.jpg'}
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.style.background = 'var(--surface-container-low)'; }}
                      />
                     <div className="absolute top-4 left-4 z-10">
                       <Badge variant={isSoldOut(event.ticketTypes) ? 'urgency' : 'available'}>
                         {isSoldOut(event.ticketTypes) ? 'Sold Out' : 'Available'}
                       </Badge>
                     </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold tracking-tightest text-on-surface mb-2 truncate uppercase">{event.name}</h3>
                  <div className="flex justify-between items-center text-on-surface-variant font-retina mt-auto text-xs md:text-sm">
                    <p className="truncate mr-4">{event.venue}</p>
                    <span className="font-mono font-bold whitespace-nowrap text-primary">{formatDate(event.date)}</span>
                  </div>
                </Link>
              ))}
            </div>


            <div className="relative rounded overflow-hidden shadow-ambient bg-surface-container-lowest">
              <img src={discoverCurtain} alt="Discover more events" className="w-full h-48 md:h-64 object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent flex flex-col justify-end p-6 md:p-12 text-on-surface">
                <h3 className="text-2xl md:text-4xl font-extrabold tracking-tightest mb-2 uppercase">Discover More Events</h3>
                <p className="font-retina text-on-surface-variant max-w-lg mb-6 text-sm md:text-base">Explore thousands of live events across music, sports, and arts. New tickets released daily.</p>
                <div>
                  <Button variant="secondary" className="w-full sm:w-auto">Load More</Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
