import React from 'react';

export default function LogGallery({ logUrls }) {
  if (!logUrls || logUrls.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Driver Logs (HOS)</h3>
      <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
        {logUrls.map((url, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">
                Log for Day {index + 1}
              </h4>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center">
              <img src={url} alt={`Log for Day ${index + 1}`} className="max-w-full h-auto object-contain rounded border border-gray-200 shadow-sm bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
