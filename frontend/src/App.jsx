import React from 'react';
import TripForm from './components/TripForm';

function App() {
  return (
    <div className="min-h-screen bg-[#fcfaf8] py-16 px-4 sm:px-6 lg:px-8 font-sans text-stone-800 selection:bg-orange-200 selection:text-stone-900">
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-700 tracking-tight">Spotter AI Online Assessment</h1>
      </header>
      <TripForm />
    </div>
  );
}

export default App;
