
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, children, ...props }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        {...props}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary sm:text-sm rounded-lg shadow-sm transition ${props.className || ''}`}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;