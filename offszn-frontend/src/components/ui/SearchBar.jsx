import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useSearchStore } from '../../store/searchStore';
import { useCurrencyStore } from '../../store/currencyStore';

const SEARCH_FILTERS = ['Todo', 'Beats', 'Drum Kits', 'Samples', 'Presets', 'Plantillas', 'Voces', 'Productores'];

const SearchBar = () => {
  const navigate = useNavigate();
  const {
    query, setQuery,
    category, setCategory,
    results, performSearch,
    history, addToHistory, removeHistoryItem,
    loading
  } = useSearchStore();

  const { formatPrice } = useCurrencyStore();
  const [isFocused, setIsFocused] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceTimer.current);
    if (val.trim()) {
      debounceTimer.current = setTimeout(() => {
        performSearch(val, category);
      }, 300);
    }
  };

  const handleKeyDown = (e) => {
    const itemsCount = query.length === 0 ? Math.min(history.length, 5) + 3 : results.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (itemsCount || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (itemsCount || 1)) % (itemsCount || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        // Find which item is selected
        if (query.length === 0) {
          const historyItems = history.slice(0, 5);
          if (selectedIndex < historyItems.length) {
            submitSearch(historyItems[selectedIndex]);
          } else {
            // Trends (hardcoded in UI for now)
            const trends = ['Dark Trap', 'Reggaeton 2025', 'Drill UK'];
            const trendIdx = selectedIndex - historyItems.length;
            if (trends[trendIdx]) submitSearch(trends[trendIdx]);
          }
        } else if (results[selectedIndex]) {
          handleItemClick(results[selectedIndex]);
        }
      } else {
        submitSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const submitSearch = (term) => {
    if (!term.trim()) return;

    // Legacy logic: Check for NEAR EXACT matches in current results for auto-redirect
    if (results.length > 0) {
      const topResult = results[0];
      // If it's a very similar match (similarity handled in store) and not a fallback
      const isVerySimilar = topResult.title.toLowerCase().includes(term.toLowerCase()) ||
        term.toLowerCase().includes(topResult.title.toLowerCase());

      if (isVerySimilar && !topResult.isFallback) {
        handleItemClick(topResult);
        return;
      }
    }

    addToHistory(term.trim());
    setIsFocused(false);
    navigate(`/explorar?q=${encodeURIComponent(term)}&type=${encodeURIComponent(category)}`);
  };

  const handleItemClick = (item) => {
    addToHistory(query || item.title);
    setIsFocused(false);
    if (item.type === 'user') {
      navigate(`/@${item.nickname}`);
    } else {
      const productUrl = `/${item.product_type || 'beat'}/${item.public_slug || item.id}`;
      navigate(productUrl);
    }
  };

  return (
    <div className="relative w-125 max-w-125" ref={containerRef}>
      {/* INPUT CONTAINER */}
      <div className={clsx(
        "flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-200",
        isFocused
          ? "bg-secondary border-[#333] z-1002"
          : "bg-[#141414] border-transparent hover:bg-[#1a1a1a]"
      )}>
        <Search className="w-4 h-4 text-gray-400" />

        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar 'trap' o 'drill'..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 font-medium"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {/* FILTER TRIGGER */}
        <div
          className={clsx(
            "flex items-center gap-1 cursor-pointer text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full transition-all",
            category !== 'Todo'
              ? "bg-white text-black"
              : "text-zinc-500 hover:text-white border border-white/5 bg-white/5"
          )}
          onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
        >
          <span>{category}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* FILTER DROPDOWN */}
      {showFilterMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl z-1003 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Filtrar por</div>
          {SEARCH_FILTERS.map(filter => (
            <div
              key={filter}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-between",
                category === filter ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
              onClick={() => { setCategory(filter); setShowFilterMenu(false); if (query) performSearch(query, filter); }}
            >
              {filter}
              {category === filter && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
          ))}
        </div>
      )}

      {/* RESULTS / HISTORY PANEL */}
      {isFocused && (
        <div className="absolute top-full left-0 w-full mt-3 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5 z-1002 animate-in fade-in slide-in-from-top-4 duration-300">

          {query.length === 0 ? (
            <>
              {history.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Recientes</span>
                    <button className="text-[10px] font-black text-white hover:opacity-70 transition-opacity uppercase tracking-widest" onClick={() => navigate('/history')}>Limpiar</button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {history.slice(0, 5).map((term, idx) => (
                      <div
                        key={term}
                        className={clsx(
                          "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all",
                          selectedIndex === idx ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                        onClick={() => submitSearch(term)}
                      >
                        <Clock className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span className="flex-1 text-sm font-bold truncate">{term}</span>
                        <X
                          className="w-4 h-4 opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all"
                          onClick={(e) => { e.stopPropagation(); removeHistoryItem(term); }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Tendencias</span>
                <div className="flex flex-wrap gap-2">
                  {['Dark Trap', 'Reggaeton 2025', 'Drill UK'].map((trend, tidx) => {
                    const absIdx = history.slice(0, 5).length + tidx;
                    return (
                      <div
                        key={trend}
                        className={clsx(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border",
                          selectedIndex === absIdx
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-zinc-300 border-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                        onClick={() => submitSearch(trend)}
                      >
                        <TrendingUp className={clsx("w-3.5 h-3.5", selectedIndex === absIdx ? "text-black" : "text-white opacity-40")} />
                        {trend}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <>
                  {results[0].isFallback && (
                    <div className="px-2 py-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Tal vez te interese</div>
                  )}
                  {results.map((item, idx) => {
                    const isUser = item.type === 'user';
                    return (
                      <div
                        key={item.id}
                        className={clsx(
                          "flex items-center gap-3.5 p-2.5 rounded-2xl cursor-pointer transition-all border border-transparent",
                          selectedIndex === idx
                            ? "bg-white/10 border-white/5"
                            : "hover:bg-white/5"
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={item.img || (isUser ? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nickname)}&background=random` : '/placeholder.jpg')}
                            alt={item.title}
                            className={clsx("w-11 h-11 object-cover shadow-2xl", isUser ? "rounded-full" : "rounded-lg")}
                          />
                          {isUser && item.is_verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-white truncate uppercase tracking-tight">{item.title}</div>
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                            {isUser ? 'PRODUCTOR' : (item.producer_name || 'OFFSZN')}
                          </div>
                        </div>
                        {!isUser && (
                          <div className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            {item.price_basic ? formatPrice(item.price_basic) : 'FREE'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sin resultados</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BACKDROP */}
      {isFocused && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-1001" style={{ top: '60px' }} />
      )}
    </div>
  );
};

export default SearchBar;