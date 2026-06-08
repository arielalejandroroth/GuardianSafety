





import React from 'react';
import { View } from '../types';
import { DashboardIcon, TableIcon, ShieldCheckIcon, ShareIcon, IdCardIcon, AiVisionIcon, DocumentDuplicateIcon, HardHatIcon, ImageIcon } from './IconComponents';
import Button from './common/Button';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
  onShareClick: () => void;
}

const NavButton: React.FC<{
  view: View,
  currentView: View,
  onNavigate: (view: View) => void,
  icon: React.ReactNode,
  label: string
}> = ({ view, currentView, onNavigate, icon, label }) => {
  const isActive = currentView === view;
  const activeClasses = 'bg-brand-secondary text-white';
  const inactiveClasses = 'text-white hover:bg-brand-secondary/75';
  return (
    <button
      onClick={() => onNavigate(view)}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      {label}
    </button>
  );
};


const MobileNavButton: React.FC<{
  view: View,
  currentView: View,
  onNavigate: (view: View) => void,
  icon: React.ReactNode,
  label: string
}> = ({ view, currentView, onNavigate, icon, label }) => {
  const isActive = currentView === view || (view === View.SEGURITO_VISION && currentView === View.EVALUATION_HISTORY);
  const activeClasses = 'text-brand-accent';
  const inactiveClasses = 'text-slate-300 hover:text-white';
  return (
    <button onClick={() => onNavigate(view)} className={`flex flex-col items-center justify-center p-2 flex-grow text-center transition-colors ${isActive ? activeClasses : inactiveClasses}`}>
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );
}


const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, onShareClick }) => {
  const isSharedMode = window.location.hostname.includes('-pre-');
  const { logout, user } = useAuth();

  return (
    <header className="bg-brand-primary sticky top-0 z-40 shadow-sm">
      <div className="max-w-full xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate(View.DASHBOARD)}>
            <ShieldCheckIcon className="h-10 w-10 text-brand-accent" />
            <h1 className="text-white text-xl sm:text-2xl font-bold ml-3 tracking-tight">SafetyGuard Pro</h1>
          </div>
          <div className="flex items-center space-x-2">
            <nav className="hidden md:flex items-center space-x-2">
              <NavButton view={View.DASHBOARD} currentView={currentView} onNavigate={onNavigate} icon={<DashboardIcon className="h-5 w-5 mr-2" />} label="Dashboard" />
              <NavButton view={View.MATRIX} currentView={currentView} onNavigate={onNavigate} icon={<TableIcon className="h-5 w-5 mr-2" />} label="Matriz" />
              <NavButton view={View.PPE_MATRIX} currentView={currentView} onNavigate={onNavigate} icon={<HardHatIcon className="h-5 w-5 mr-2" />} label="EPP" />
              <NavButton view={View.QUALIFICATIONS} currentView={currentView} onNavigate={onNavigate} icon={<IdCardIcon className="h-5 w-5 mr-2" />} label="Habilitaciones" />
              <NavButton view={View.QUALIFICATION_CARDS_GALLERY} currentView={currentView} onNavigate={onNavigate} icon={<DocumentDuplicateIcon className="h-5 w-5 mr-2" />} label="Carnets" />
              <NavButton view={View.SEGURITO_VISION} currentView={currentView} onNavigate={onNavigate} icon={<AiVisionIcon className="h-5 w-5 mr-2" />} label="Segurito Vision" />
              {!isSharedMode && <NavButton view={View.IMAGE_GENERATOR} currentView={currentView} onNavigate={onNavigate} icon={<ImageIcon className="h-5 w-5 mr-2" />} label="Gen. Imagen" />}
            </nav>
            {!isSharedMode && (
              <>
                <div className="w-px h-6 bg-brand-secondary/50 mx-2 hidden md:block"></div>
                <Button variant="secondary" onClick={onShareClick} className="!px-3 !py-2">
                    <ShareIcon className="h-5 w-5 mr-0 md:mr-2" />
                    <span className="hidden md:inline">Compartir</span>
                </Button>
              </>
            )}
            {user && (
              <Button variant="danger" onClick={logout} className="!px-3 !py-2 ml-2">
                <span className="hidden md:inline">Salir</span>
                <span className="md:hidden text-xs">Salir</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Navigation Bar */}
      <nav className="md:hidden bg-brand-dark fixed bottom-0 left-0 right-0 z-50 shadow-t-lg" style={{backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)'}}>
        <div className="flex justify-around items-center h-16">
          <MobileNavButton view={View.DASHBOARD} currentView={currentView} onNavigate={onNavigate} icon={<DashboardIcon className="h-6 w-6" />} label="Dashboard" />
          <MobileNavButton view={View.MATRIX} currentView={currentView} onNavigate={onNavigate} icon={<TableIcon className="h-6 w-6" />} label="Matriz" />
          <MobileNavButton view={View.PPE_MATRIX} currentView={currentView} onNavigate={onNavigate} icon={<HardHatIcon className="h-6 w-6" />} label="EPP" />
          <MobileNavButton view={View.QUALIFICATIONS} currentView={currentView} onNavigate={onNavigate} icon={<IdCardIcon className="h-6 w-6" />} label="Habilit." />
          <MobileNavButton view={View.SEGURITO_VISION} currentView={currentView} onNavigate={onNavigate} icon={<AiVisionIcon className="h-6 w-6" />} label="IA Vision" />
        </div>
      </nav>
    </header>
  );
};

export default Header;