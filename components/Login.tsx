import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, ShieldCheck, Mail, ArrowRight, CheckCircle2, UserCheck, Smartphone } from 'lucide-react';
import { PRE_AUTHORIZED_USERS } from '../utils/storage';

const Login: React.FC = () => {
  const { login, loginWithEmailDirect, error: globalError } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [isMobileWebView, setIsMobileWebView] = useState(false);

  useEffect(() => {
    // Detect if inside an in-app browser like WhatsApp, Telegram, or Instagram
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isWv = /FBAN|FBAV|Instagram|WhatsApp|Line|Telegram|MicroMessenger/i.test(ua);
    setIsMobileWebView(isWv);
  }, []);

  useEffect(() => {
    if (globalError) {
      handleErrorDisplay(globalError);
    }
  }, [globalError]);

  const handleErrorDisplay = (err: any) => {
    if (err?.code === 'auth/popup-blocked') {
      setLocalError("El navegador bloqueó la ventana emergente de Google. Por favor, usa el 'Ingreso Directo con tu Correo' arriba.");
    } else if (err?.code === 'auth/unauthorized-domain') {
      setLocalError("Dominio en proceso de verificación por Google. Usa el 'Ingreso Directo con tu Correo' arriba para acceder inmediatamente.");
    } else if (err?.message) {
      setLocalError(`Error al conectar con Google: ${err.message}. Puedes ingresar directamente con tu correo arriba.`);
    } else {
      setLocalError("Ocurrió un error inesperado. Puedes ingresar directamente con tu correo arriba.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      setInfoMessage(null);
      setIsAuthenticating(true);
      await login();
    } catch (err: any) {
      console.error("Login failed", err);
      setIsAuthenticating(false);
      handleErrorDisplay(err);
    }
  };

  const handleDirectEmailLogin = async (targetEmail?: string) => {
    const emailToUse = (targetEmail || emailInput).trim();
    if (!emailToUse) {
      setLocalError("Por favor ingresa tu correo electrónico autorizado.");
      return;
    }
    try {
      setLocalError(null);
      setInfoMessage(null);
      setIsDirectLoading(true);
      const result = await loginWithEmailDirect(emailToUse);
      if (result.success) {
        setInfoMessage(result.message);
      } else {
        setLocalError(result.message);
      }
    } catch (err: any) {
      setLocalError(err?.message || "Error al validar correo");
    } finally {
      setIsDirectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 text-white mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SafetyGuard Pro
          </h1>
          <p className="text-sm text-blue-200/80 mt-1">
            Sistema Integral de Seguridad e Higiene Industrial
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              Acceso a la Plataforma Operativa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresa con tu correo designado para cargar desvíos, incidentes y auditorías.
            </p>
          </div>

          {/* Feedback messages */}
          {localError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start text-left text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{localError}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start text-left text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Mobile webview helper */}
          {isMobileWebView && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-amber-900 text-xs flex items-start space-x-2">
              <Smartphone className="w-4 h-4 flex-shrink-0 text-amber-700 mt-0.5" />
              <div>
                <strong>Aviso WhatsApp / Móvil:</strong> Para ingresar sin bloqueos, utiliza el <strong>Ingreso Directo con tu Correo</strong> abajo.
              </div>
            </div>
          )}

          {/* Option 1: Direct Email Access (Reliable on all mobile browsers) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Ingreso Directo para Personal Designado:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDirectEmailLogin()}
                placeholder="ej: carlafernandxz@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={() => handleDirectEmailLogin()}
              disabled={isDirectLoading || !emailInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all disabled:opacity-50"
            >
              {isDirectLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Access for Pre-Authorized Users */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Acceso Rápido para Personal Designado
            </span>
            <div className="space-y-1.5">
              {PRE_AUTHORIZED_USERS.map((preUser) => (
                <button
                  key={preUser.email}
                  onClick={() => {
                    setEmailInput(preUser.email);
                    handleDirectEmailLogin(preUser.email);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/60 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {preUser.displayName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                        {preUser.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {preUser.email}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    preUser.role === 'admin' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {preUser.role === 'admin' ? 'Admin' : 'Supervisor'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option 2: Google Sign In */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              O con Cuenta de Google
            </span>
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-700 font-medium py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-xs sm:text-sm disabled:opacity-50"
            >
              {isAuthenticating ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-blue-200/70 space-y-1">
          <p className="flex items-center justify-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceso controlado por Rol (Admin, Supervisor, Lector)</span>
          </p>
          <p>&copy; {new Date().getFullYear()} GuardianSafetyPro. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
