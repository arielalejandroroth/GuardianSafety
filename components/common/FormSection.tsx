import React, { useState } from 'react';
import { ChevronDownIcon } from '../IconComponents';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left p-4 bg-slate-50 hover:bg-slate-100 focus:outline-none transition-colors"
      >
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <ChevronDownIcon
          className={`h-5 w-5 text-slate-500 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="p-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
};

export default FormSection;
