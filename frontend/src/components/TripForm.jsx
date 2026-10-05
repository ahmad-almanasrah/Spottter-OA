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
    setResponse(null); // Clear previous response/errors
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/route/', formData);
      setResponse(res.data);
    } catch (err) {
      setResponse(err.response?.data || { error: err.message || 'An unexpected error occurred.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 p-8 bg-white shadow-xl rounded-2xl border border-gray-100 text-left transition-all duration-300">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">Plan Your Trip</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AutocompleteInput
              label="Current Location"
              name="current_location"
              value={formData.current_location}
              onChange={handleChange}
              placeholder="e.g. New York, NY"
            />
          </div>
          <div>
            <AutocompleteInput
              label="Pickup Location"
              name="pickup"
              value={formData.pickup}
              onChange={handleChange}
              placeholder="e.g. Philadelphia, PA"
            />
          </div>
          <div>
            <AutocompleteInput
              label="Dropoff Location"
              name="dropoff"
              value={formData.dropoff}
              onChange={handleChange}
              placeholder="e.g. Washington, DC"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Available Cycle Hours</label>
            <input
              type="number"
              name="cycle_hours"
              value={formData.cycle_hours}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm border px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
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
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating Route...
            </>
          ) : (
            'Calculate Route'
          )}
        </button>
      </form>
      
      {loading && !response && (
        <div className="mt-12 space-y-6 animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
          <div className="h-96 bg-gray-200 rounded-xl w-full"></div>
        </div>
      )}

      {response && response.geometry && !loading && (
        <div className="mt-12 animate-fade-in-up">
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Route Overview</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm w-48">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Distance</span>
                <span className="text-3xl font-bold text-blue-600">{response.distance_miles}<span className="text-lg text-gray-600 font-medium ml-1">mi</span></span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm w-48">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Duration</span>
                <span className="text-3xl font-bold text-green-600">{Math.round(response.duration_seconds / 60)}<span className="text-lg text-gray-600 font-medium ml-1">min</span></span>
              </div>
            </div>
          </div>
          <RouteMap routeData={response} />
          {response.log_urls && <LogGallery logUrls={response.log_urls} />}
        </div>
      )}

      {response && response.error && !loading && (
        <div className="mt-8 p-6 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-start shadow-sm">
          <svg className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">Routing Error</h3>
            <p className="text-red-700">{response.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
