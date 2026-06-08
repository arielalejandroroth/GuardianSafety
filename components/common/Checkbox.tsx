
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="flex items-center space-x-3 text-gray-700">
      <input
        type="checkbox"
        className="form-checkbox h-5 w-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
};

export default Checkbox;
