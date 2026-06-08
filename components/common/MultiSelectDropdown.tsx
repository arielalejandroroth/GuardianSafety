import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../IconComponents';

interface MultiSelectDropdownProps {
  label: string;
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };
  
  const handleSelectAll = () => {
      onChange(options.map(o => o.value));
  };

  const handleClear = () => {
      onChange([]);
  };

  return (
    <div ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-slate-300 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
        >
          <span className="block truncate text-slate-800">
            {selectedValues.length > 0 ? `${selectedValues.length} de ${options.length} seleccionados` : 'Todos'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-80 w-full overflow-hidden rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <div className="p-2 flex gap-2 border-b">
                 <button onClick={handleSelectAll} className="flex-1 text-xs bg-brand-light text-brand-primary hover:bg-blue-200 px-2 py-1 rounded-md">
                    Seleccionar Todo
                </button>
                 <button onClick={handleClear} className="flex-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded-md">
                    Limpiar
                </button>
            </div>
            <ul className="overflow-auto max-h-60">
                {options.map((option) => (
                <li
                    key={option.value}
                    className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 hover:bg-slate-100"
                    onClick={() => handleOptionClick(option.value)}
                >
                    <span className={`block truncate ${selectedValues.includes(option.value) ? 'font-medium text-brand-primary' : 'font-normal'}`}>
                    {option.label}
                    </span>
                    {selectedValues.includes(option.value) && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-primary">
                        ✓
                    </span>
                    )}
                </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;
