import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-slate-400 text-sm text-center p-4 mt-8 no-print">
      <div className="max-w-full xl:max-w-8xl mx-auto">
        <p>&copy; {new Date().getFullYear()} SafetyGuard Pro. Todos los derechos reservados.</p>
        <p>Una aplicación de gestión de seguridad integral para GuardianSafety.</p>
      </div>
    </footer>
  );
};

export default Footer;
