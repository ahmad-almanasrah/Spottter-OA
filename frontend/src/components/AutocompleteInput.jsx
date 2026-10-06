import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AutocompleteInput({ label, name, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const res = await axios.get(`${baseUrl}/api/autocomplete/?q=${encodeURIComponent(value)}`);
        setSuggestions(res.data);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    };

    const debounce = setTimeout(() => {
      if (showDropdown) {
        fetchSuggestions();
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [value, showDropdown]);

  const handleSelect = (suggestion) => {
    onChange({ target: { name, value: suggestion.place_name } });
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    onChange(e);
    setShowDropdown(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-stone-600 mb-2 ml-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        className="block w-full rounded-2xl border-stone-200 shadow-sm bg-stone-50 hover:bg-white px-5 py-4 text-stone-700 focus:border-orange-300 focus:ring-orange-200 transition-colors placeholder-stone-400 outline-none"
        required
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-stone-100 shadow-xl rounded-2xl mt-2 max-h-60 overflow-y-auto py-2">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(s)}
              className="px-5 py-3 hover:bg-orange-50 cursor-pointer text-sm text-stone-700 transition-colors"
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
