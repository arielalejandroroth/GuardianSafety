import React from 'react';
import { View } from '../types';
import {
  DashboardIcon,
  TableIcon,
  ShieldCheckIcon,
  ShareIcon,
  IdCardIcon,
  AiVisionIcon,
  DocumentDuplicateIcon,
  HardHatIcon,
  ImageIcon
} from './IconComponents';
import Button from './common/Button';
import { GeminiKeyModal } from './GeminiKeyModal';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
  onShareClick: () => void;
}

const NavButton: React.FC<{
  view: View;
  currentView: View;
  onNavigate: (view: View) => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}> = ({ view, currentView, onNavigate, icon, label, badge }) => {
  const isActive = currentView === view;
  const activeClasses = 'bg-brand-secondary text-white';
  const inactiveClasses = 'text-white hover:bg-brand-secondary/75';
  return (
    <button
      onClick={() => onNavigate(view)}
      className={`relative flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-amber-400 text-slate-900 font-bold rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};

const MobileNavButton: React.FC<{
  view: View;
  currentView: View;
  onNavigate: (view: View) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ view, currentView, onNavigate, icon, label }) => {
  const isActive =
    currentView === view ||
    (view === View.SEGURITO_VISION && currentView === View.EVALUATION_HISTORY);
  const activeClasses = 'text-brand-accent';
  const inactiveClasses = 'text-slate-300 hover:text-white';
  return (
    <button
      onClick={() => onNavigate(view)}
      className={`flex flex-col items-center justify-center p-2 flex-grow text-center transition-colors ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, onShareClick }) => {
  const isSharedMode = window.location.hostname.includes('-pre-');
  const { logout, user, isAdmin, role } = useAuth();
  const [isKeyModalOpen, setIsKeyModalOpen] = React.useState(false);

  return (
    <header className="bg-brand-primary sticky top-0 z-40 shadow-sm">
      <div className="max-w-full xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onNavigate(View.DASHBOARD)}
          >
            <ShieldCheckIcon className="h-10 w-10 text-brand-accent" />
            <div className="ml-3">
              <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
                SafetyGuard Pro
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <nav className="hidden md:flex items-center space-x-1.5">
              <NavButton
                view={View.DASHBOARD}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<DashboardIcon className="h-5 w-5 mr-1.5" />}
                label="Dashboard"
              />
              <NavButton
                view={View.MATRIX}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<TableIcon className="h-5 w-5 mr-1.5" />}
                label="Matriz"
              />
              <NavButton
                view={View.PPE_MATRIX}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<HardHatIcon className="h-5 w-5 mr-1.5" />}
                label="EPP"
              />
              <NavButton
                view={View.QUALIFICATIONS}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<IdCardIcon className="h-5 w-5 mr-1.5" />}
                label="Habilitaciones"
              />
              <NavButton
                view={View.QUALIFICATION_CARDS_GALLERY}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<DocumentDuplicateIcon className="h-5 w-5 mr-1.5" />}
                label="Carnets"
              />
              <NavButton
                view={View.SEGURITO_VISION}
                currentView={currentView}
                onNavigate={onNavigate}
                icon={<AiVisionIcon className="h-5 w-5 mr-1.5" />}
                label="Segurito Vision"
              />
              {!isSharedMode && (
                <NavButton
                  view={View.IMAGE_GENERATOR}
                  currentView={currentView}
                  onNavigate={onNavigate}
                  icon={<ImageIcon className="h-5 w-5 mr-1.5" />}
                  label="Gen. Imagen"
                />
              )}
              {isAdmin && (
                <NavButton
                  view={View.USER_MANAGEMENT}
                  currentView={currentView}
                  onNavigate={onNavigate}
                  icon={<ShieldCheckIcon className="h-5 w-5 mr-1.5 text-amber-300" />}
                  label="Usuarios y Accesos"
                  badge="Admin"
                />
              )}
            </nav>

            <div className="w-px h-6 bg-brand-secondary/50 mx-1 hidden md:block"></div>

            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-secondary/80 hover:bg-brand-secondary text-brand-accent transition border border-brand-accent/30 mr-1 sm:mr-2"
              title="Configurar Clave de IA (Google Gemini)"
            >
              <span className="mr-1">✨</span>
              <span className="hidden sm:inline">Clave IA</span>
            </button>

            <Button
              variant="secondary"
              onClick={onShareClick}
              className="!px-3 !py-1.5 text-xs sm:text-sm"
              title="Compartir enlace para usuarios finales"
            >
              <ShareIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>

            {user && (
              <div className="flex items-center ml-2 space-x-2">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-white text-xs font-medium max-w-[150px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-brand-accent uppercase tracking-wider font-bold">
                    {isAdmin ? 'ADMINISTRADOR' : role.toUpperCase()}
                  </span>
                </div>
                <Button
                  variant="danger"
                  onClick={logout}
                  className="!px-2.5 !py-1.5 text-xs"
                >
                  Salir
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav
        className="md:hidden bg-brand-dark fixed bottom-0 left-0 right-0 z-50 shadow-t-lg"
        style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }}
      >
        <div className="flex justify-around items-center h-16">
          <MobileNavButton
            view={View.DASHBOARD}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<DashboardIcon className="h-6 w-6" />}
            label="Dashboard"
          />
          <MobileNavButton
            view={View.MATRIX}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<TableIcon className="h-6 w-6" />}
            label="Matriz"
          />
          <MobileNavButton
            view={View.PPE_MATRIX}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<HardHatIcon className="h-6 w-6" />}
            label="EPP"
          />
          <MobileNavButton
            view={View.QUALIFICATIONS}
            currentView={currentView}
            onNavigate={onNavigate}
            icon={<IdCardIcon className="h-6 w-6" />}
            label="Habilit."
          />
          {isAdmin ? (
            <MobileNavButton
              view={View.USER_MANAGEMENT}
              currentView={currentView}
              onNavigate={onNavigate}
              icon={<ShieldCheckIcon className="h-6 w-6 text-amber-300" />}
              label="Usuarios"
            />
          ) : (
            <MobileNavButton
              view={View.SEGURITO_VISION}
              currentView={currentView}
              onNavigate={onNavigate}
              icon={<AiVisionIcon className="h-6 w-6" />}
              label="IA Vision"
            />
          )}
        </div>
      </nav>
      <GeminiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </header>
  );
};

export default Header;