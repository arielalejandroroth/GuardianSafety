import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleAction?: React.ReactNode;
  contentClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, titleAction, contentClassName = 'p-4 sm:p-6' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {title && (
        <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
            {titleAction && <div>{titleAction}</div>}
        </div>
      )}
      <div className={contentClassName}>
         {children}
      </div>
    </div>
  );
};

export default Card;