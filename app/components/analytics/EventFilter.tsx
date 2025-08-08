'use client';

import { useState } from 'react';

interface EventFilterProps {
  eventType: string;
  properties: string[];
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function EventFilter({ eventType, properties, onFilterChange }: EventFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (property: string, value: string) => {
    const newFilters = {
      ...filters,
      [property]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRemoveFilter = (property: string) => {
    const newFilters = { ...filters };
    delete newFilters[property];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        <span>Filter Properties</span>
        <svg
          className={`ml-1 h-4 w-4 transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {Object.entries(filters).map(([property, value]) => (
            <div key={property} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{property}:</span>
              <input
                type="text"
                value={value}
                onChange={(e) => handleFilterChange(property, e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Enter value..."
              />
              <button
                onClick={() => handleRemoveFilter(property)}
                className="text-red-600 hover:text-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <select
              value=""
              onChange={(e) => {
                const property = e.target.value;
                if (property) {
                  handleFilterChange(property, '');
                }
              }}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Add property filter...</option>
              {properties
                .filter((prop) => !filters[prop])
                .map((prop) => (
                  <option key={prop} value={prop}>
                    {prop}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
} 