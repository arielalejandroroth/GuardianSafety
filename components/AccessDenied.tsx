import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon } from './IconComponents';
import Button from './common/Button';
import { SUPER_ADMIN_EMAIL } from '../utils/storage';

const AccessDenied: React.FC = () => {
  const { user, userStatus, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const isRevoked = userStatus === 'revoked';

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            isRevoked ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isRevoked ? (
            <ExclamationTriangleIcon className="h-9 w-9" />
          ) : (
            <ShieldCheckIcon className="h-9 w-9" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isRevoked ? 'Acceso Revocado' : 'Acceso Pendiente de Autorización'}
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          {isRevoked ? (
            <>
              Tus permisos de acceso a <strong>SafetyGuard Pro</strong> han sido revocados o desactivados por el
              administrador del sistema.
            </>
          ) : (
            <>
              Has iniciado sesión correctamente como <span className="font-semibold text-slate-900">{user?.email}</span>.
              <br />
              <span className="inline-block mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Tu solicitud de acceso ha sido enviada al Administrador.
              </span>
            </>
          )}
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-2 mb-6">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold">
            <span>ℹ️ Información de Contacto del Administrador:</span>
          </div>
          <p>
            Comunícate con el Administrador / Creador de la aplicación para activar o modificar tus permisos:
          </p>
          <div className="p-2 bg-white rounded border border-slate-200 font-mono text-brand-primary break-all">
            {SUPER_ADMIN_EMAIL}
          </div>
        </div>

        <div className="space-y-3">
          {!isRevoked && (
            <Button
              variant="primary"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full flex items-center justify-center"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              {checking ? 'Comprobando permisos...' : 'Comprobar si ya fui autorizado'}
            </Button>
          )}

          <Button variant="secondary" onClick={logout} className="w-full">
            Cerrar Sesión e Intentar con Otra Cuenta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
