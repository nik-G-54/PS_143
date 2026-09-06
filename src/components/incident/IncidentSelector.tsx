import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { spillService } from '../../services/spillService';

interface IncidentSummary {
  spill_id: string;
  detected_at: string;
  area_km2: number;
  confidence_score: number;
  centroid: { lat: number; lon: number };
  candidate_count: number;
}

interface IncidentSelectorProps {
  currentSpillId: string;
}

export const IncidentSelector: React.FC<IncidentSelectorProps> = ({ currentSpillId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadIncidents = async (pageNum: number, isReset: boolean = false) => {
    setLoading(true);
    try {
      const data = await spillService.getSpills(pageNum, 20);
      const items = Array.isArray(data) ? data : data.items || [];
      const total = data.total || items.length;

      // Normalize backend data
      const mapped = items.map((d: any) => ({
        spill_id: d.spill_id,
        detected_at: d.detected_at,
        area_km2: d.area_km2,
        confidence_score: d.confidence_score,
        centroid: { lat: d.centroid?.latitude ?? d.centroid?.lat ?? 0, lon: d.centroid?.longitude ?? d.centroid?.lon ?? 0 },
        candidate_count: d.candidate_count ?? 0
      }));

      if (isReset) {
        setIncidents(mapped);
      } else {
        setIncidents(prev => [...prev, ...mapped]);
      }

      setHasMore(incidents.length + (isReset ? mapped.length : mapped.length) < total);
    } catch (err) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load when dropdown opens
  useEffect(() => {
    if (isOpen && incidents.length === 0) {
      loadIncidents(1, true);
    }
  }, [isOpen, incidents.length]);

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPage = page + 1;
    setPage(nextPage);
    loadIncidents(nextPage);
  };

  const handleSelect = (spillId: string) => {
    setIsOpen(false);
    // URL Sync
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('id', spillId);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const filteredIncidents = incidents.filter(inc => 
    inc.spill_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between min-w-[140px] bg-muted/30 hover:bg-muted/50 border border-border px-3 py-1.5 rounded transition-colors"
      >
        <span className="font-mono text-primary font-semibold text-sm mr-2">{currentSpillId}</span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 sm:w-80 bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-border bg-muted/20">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search incidents..." 
                className="w-full bg-background border border-border rounded pl-8 pr-3 py-1.5 text-sm font-sans focus:outline-none focus:border-primary/50 transition-colors"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredIncidents.length === 0 && !loading && (
              <div className="text-center p-4 text-muted-foreground text-sm font-sans">
                No incidents found.
              </div>
            )}
            
            {filteredIncidents.map(inc => (
              <div 
                key={inc.spill_id}
                onClick={() => handleSelect(inc.spill_id)}
                className={`p-2 rounded cursor-pointer border ${inc.spill_id === currentSpillId ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50 border-transparent'} transition-colors`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-sm font-bold text-foreground">{inc.spill_id}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    {inc.detected_at ? new Date(inc.detected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-sans">
                  <span>{inc.area_km2?.toFixed(2)} km²</span>
                  <span>{(inc.confidence_score * 100).toFixed(0)}% conf.</span>
                </div>
              </div>
            ))}

            {hasMore && (
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Load More'}
              </button>
            )}
            
            {loading && incidents.length === 0 && (
              <div className="flex justify-center p-4">
                <Loader2 size={16} className="text-primary animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
