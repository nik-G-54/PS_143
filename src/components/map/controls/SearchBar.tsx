import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { SpillEvent } from '../../../types/map';

interface SearchBarProps {
  spills: SpillEvent[];
  onSelectSpill: (spill: SpillEvent) => void;
  theme: 'light' | 'dark';
}

export function SearchBar({ spills, onSelectSpill, theme }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = spills.filter(s =>
    s.spill_id.toLowerCase().includes(query.toLowerCase()) ||
    s.source_dataset.toLowerCase().includes(query.toLowerCase())
  );

  const cardBg = theme === 'dark' ? 'bg-[#1A1D27] border-[#252830]' : 'bg-white border-[#E5E7EB]';
  const inputBg = theme === 'dark' ? 'bg-[#252830]' : 'bg-[#F9FAFB]';
  const textColor = theme === 'dark' ? 'text-[#F1F5F9]' : 'text-[#1A1D23]';
  const placeholderColor = 'placeholder-[#64748B]';

  return (
    <div className="absolute top-4 left-4 z-10 w-72">
      <div className={`${cardBg} border rounded-xl shadow-lg overflow-hidden`}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search spill ID, location..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className={`w-full h-11 pl-10 pr-10 ${inputBg} border-0 text-sm ${textColor} 
                        ${placeholderColor} focus:outline-none focus:ring-2 
                        focus:ring-[#00D9A6]/30`}
          />
          {query && (
            <button onClick={() => { setQuery(''); setIsOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {isOpen && query && (
          <div className={`max-h-60 overflow-y-auto border-t ${theme === 'dark' ? 'border-[#252830]' : 'border-[#E5E7EB]'}`}>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#64748B]">No spills found</div>
            ) : (
              filtered.map(spill => (
                <button
                  key={spill.spill_id}
                  onClick={() => { onSelectSpill(spill); setIsOpen(false); setQuery(''); }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#252830] transition flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <div className={`text-sm font-mono font-semibold ${theme === 'dark' ? 'text-[#00D9A6]' : 'text-[#00B894]'}`}>{spill.spill_id}</div>
                    <div className="text-xs text-[#64748B]">
                      {spill.centroid.latitude.toFixed(2)}°N, {spill.centroid.longitude.toFixed(2)}°E
                    </div>
                  </div>
                  <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full
                    ${spill.status === 'attributed' ? 'bg-green-500/10 text-green-400'
                      : spill.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-blue-500/10 text-blue-400'}`}>
                    {spill.status}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
