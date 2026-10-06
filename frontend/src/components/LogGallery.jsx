import React from 'react';

export default function LogGallery({ logUrls }) {
  if (!logUrls || logUrls.length === 0) return null;

  return (
    <div className="mt-20">
      <h3 className="text-2xl font-bold text-stone-700 mb-10 text-center font-serif">Driver Logs</h3>
      <div className="space-y-16">
        {logUrls.map((url, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <h4 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-widest">Day {idx + 1}</h4>
            <div className="w-full overflow-hidden rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-200 bg-white p-4">
              <img 
                src={url} 
                alt={`Driver Log Day ${idx + 1}`} 
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
