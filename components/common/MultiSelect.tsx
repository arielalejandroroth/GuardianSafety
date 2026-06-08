import React, { useState, useEffect, useRef } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selectedValues, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(o => o !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div className={`relative ${className || ''}`} ref={containerRef}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div 
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary sm:text-sm rounded-lg shadow-sm transition cursor-pointer flex justify-between items-center min-h-[38px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate block mr-2">
            {selectedValues.length === 0 ? 'Todos' : selectedValues.join(', ')}
        </span>
        <svg className="h-4 w-4 text-slate-400 pointer-events-none shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
            <div
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-100"
                onClick={() => {
                   onChange([]);
                }}
            >
                <span className={`block truncate ${selectedValues.length === 0 ? 'font-semibold text-brand-primary' : 'text-slate-700'}`}>Todos</span>
            </div>
          {options.map((option) => (
            <div
              key={option}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(option);
              }}
            >
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedValues.includes(option)} 
                  onChange={() => {}} 
                  className="h-4 w-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary mr-2 pointer-events-none"
                />
                <span className="font-normal block truncate">
                  {option}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
