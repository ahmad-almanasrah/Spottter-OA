import React from 'react';
import TripForm from './components/TripForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-200">
      <header className="max-w-5xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight mb-2">Spotter Dispatch</h1>
        <p className="text-lg text-gray-600 font-medium">Intelligent Route & HOS Planning</p>
      </header>
      <TripForm />
    </div>
  );
}

export default App;
