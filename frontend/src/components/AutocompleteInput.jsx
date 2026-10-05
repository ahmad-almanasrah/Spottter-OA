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
        const res = await axios.get(`http://127.0.0.1:8000/api/autocomplete/?q=${encodeURIComponent(value)}`);
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
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        className="block w-full rounded-lg border-gray-300 shadow-sm border px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
        required
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors"
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
