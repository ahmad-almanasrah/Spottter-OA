import React, { useState } from 'react';
import axios from 'axios';
import RouteMap from './RouteMap';
import LogGallery from './LogGallery';
import AutocompleteInput from './AutocompleteInput';

export default function TripForm() {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup: '',
    dropoff: '',
    cycle_hours: ''
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.cycle_hours === '' || formData.cycle_hours === undefined) {
      setResponse({ error: 'Available Cycle Hours is required.' });
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/route/', formData);
      setResponse(res.data);
    } catch (err) {
      setResponse(err.response?.data || { error: err.message || 'An unexpected error occurred.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 sm:p-12 bg-white shadow-xl shadow-stone-200/50 rounded-[2rem] border border-stone-100 text-left transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AutocompleteInput
              label="Current Location"
              name="current_location"
              value={formData.current_location}
              onChange={handleChange}
              placeholder="Where are you starting?"
            />
          </div>
          <div>
            <AutocompleteInput
              label="Pickup Location"
              name="pickup"
              value={formData.pickup}
              onChange={handleChange}
              placeholder="First stop"
            />
          </div>
          <div>
            <AutocompleteInput
              label="Dropoff Location"
              name="dropoff"
              value={formData.dropoff}
              onChange={handleChange}
              placeholder="Final destination"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-stone-600 mb-2 ml-1">Available Cycle Hours</label>
            <input
              type="number"
              name="cycle_hours"
              value={formData.cycle_hours}
              onChange={handleChange}
              className="block w-full rounded-2xl border-stone-200 shadow-sm px-5 py-4 text-stone-700 focus:border-orange-300 focus:ring-orange-200 bg-stone-50 hover:bg-white transition-colors placeholder-stone-400 outline-none"
              required
              min="0"
              max="70"
              placeholder="e.g. 11"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 flex justify-center items-center py-4 px-6 rounded-2xl shadow-sm text-lg font-semibold text-orange-900 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Charting the course...
            </>
          ) : (
            'Plan Route'
          )}
        </button>
      </form>
      
      {loading && !response && (
        <div className="mt-16 space-y-8 animate-pulse max-w-4xl mx-auto opacity-60">
          <div className="h-8 bg-stone-200 rounded-full w-1/3 mx-auto"></div>
          <div className="h-96 bg-stone-100 rounded-[2rem] w-full"></div>
        </div>
      )}

      {response && response.geometry && !loading && (
        <div className="mt-16 animate-fade-in-up">
          <div className="bg-[#fcfaf8] rounded-[2rem] p-10 mb-12 border border-stone-100 shadow-inner">
            <h3 className="text-2xl font-bold text-stone-700 mb-8 text-center font-serif">Journey Overview</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <div className="flex flex-col items-center p-6 bg-teal-50 rounded-3xl w-52 shadow-sm border border-teal-100/50">
                <span className="text-sm font-semibold text-teal-700/70 uppercase tracking-widest mb-1">Distance</span>
                <span className="text-4xl font-extrabold text-teal-900">{response.distance_miles}<span className="text-lg text-teal-700/60 font-medium ml-1">mi</span></span>
              </div>
              <div className="flex flex-col items-center p-6 bg-rose-50 rounded-3xl w-52 shadow-sm border border-rose-100/50">
                <span className="text-sm font-semibold text-rose-700/70 uppercase tracking-widest mb-1">Duration</span>
                <span className="text-4xl font-extrabold text-rose-900">{Math.round(response.duration_seconds / 60)}<span className="text-lg text-rose-700/60 font-medium ml-1">min</span></span>
              </div>
            </div>
          </div>
          <RouteMap routeData={response} />
          {response.log_urls && <LogGallery logUrls={response.log_urls} />}
        </div>
      )}

      {response && response.error && !loading && (
        <div className="mt-10 p-6 bg-red-50/80 text-red-800 rounded-2xl border border-red-100 flex items-start shadow-sm">
          <svg className="h-6 w-6 text-red-400 mr-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-base font-bold text-red-800 mb-1">Oops, something went wrong</h3>
            <p className="text-red-700/90 text-sm">{response.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
