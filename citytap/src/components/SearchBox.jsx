import { useState, useEffect, useRef } from 'react';
import { searchCities } from '../utils/gameLogic';

function SearchBox({ onSubmit, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length > 0) {
      const cities = searchCities(query);
      setResults(cities);
      setShowResults(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleSubmit = (city) => {
    if (city && onSubmit) {
      onSubmit(city);
      setQuery('');
      setResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSubmit(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSubmit(results[0]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const handleResultClick = (city) => {
    handleSubmit(city);
  };

  return (
    <div className={`citytap-search${query.length > 0 ? ' is-typing' : ''}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder="Type a city name..."
        disabled={disabled}
        className="citytap-search-input"
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          outline: 'none',
          transition: 'border-color 0.2s',
          backgroundColor: disabled ? 'var(--input-disabled)' : 'var(--input-bg)',
          color: 'var(--text)'
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = 'var(--accent)';
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = 'var(--border)';
        }}
      />
      
      {showResults && results.length > 0 && (
        <div className="citytap-search-results" role="listbox">
          {results.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${city.lat}`}
              onMouseDown={() => handleResultClick(city)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? 'var(--dropdown-selected)' : 'var(--surface)',
                borderBottom: index < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'var(--dropdown-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text)' }}>{city.name}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{city.country}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
