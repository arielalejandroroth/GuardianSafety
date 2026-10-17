import React, { useState, useEffect, useCallback } from 'react';
import { checkServerStatus, fetchApiDatos, ServerEstado, ApiDataStatus } from '../services/apiService';

interface ApiDataStatusCardProps {
  onClose?: () => void;
  standalone?: boolean;
}

export const ApiDataStatusCard: React.FC<ApiDataStatusCardProps> = ({ onClose, standalone = false }) => {
  const [serverStatus, setServerStatus] = useState<ServerEstado | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState<boolean>(true);
  
  const [dataStatus, setDataStatus] = useState<ApiDataStatus>('idle');
  const [datos, setDatos] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadServerStatus = useCallback(async () => {
    setIsCheckingServer(true);
    const status = await checkServerStatus();
    setServerStatus(status);
    setIsCheckingServer(false);
  }, []);

  const loadDatos = useCallback(async () => {
    setDataStatus('loading');
    setErrorMessage('');
    const result = await fetchApiDatos();
    setDataStatus(result.status);
    if (result.status === 'success' || result.status === 'empty_data') {
      setDatos(result.data);
    } else {
      setDatos(null);
      setErrorMessage(result.errorMessage || 'No se pudieron cargar los datos en este momento. Intenta nuevamente.');
    }
  }, []);

  useEffect(() => {
    loadServerStatus();
  }, [loadServerStatus]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${standalone ? 'p-4 sm:p-6' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Conexión Backend y Datos Seguros</h3>
            <p className="text-xs text-slate-500">Endpoints /api/estado y /api/datos</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Server Health Status Banner */}
      <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Servidor Node.js:</span>
            {isCheckingServer ? (
              <span className="inline-flex items-center text-xs text-slate-500 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span>
                Consultando...
              </span>
            ) : serverStatus?.ok ? (
              <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                Operativo
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                {serverStatus?.servidor || 'Sin respuesta'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Clave API Backend:</span>
            {isCheckingServer ? (
              <span className="text-xs text-slate-400">...</span>
            ) : serverStatus?.apiKeyConfigurada ? (
              <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                ✓ Configurada en Servidor
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                ⚠ Pendiente en Hostinger
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={loadServerStatus}
            disabled={isCheckingServer}
            className="text-xs text-brand-primary hover:underline font-medium ml-auto"
          >
            Actualizar estado
          </button>
        </div>
      </div>

      {/* Data Fetch Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Consulta de Datos (/api/datos)</span>
          <button
            type="button"
            onClick={loadDatos}
            disabled={dataStatus === 'loading'}
            className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary active:scale-95 text-white text-xs font-medium rounded-lg transition shadow-sm disabled:opacity-50 flex items-center space-x-1"
          >
            {dataStatus === 'loading' ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white mr-1" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Consultando...</span>
              </>
            ) : (
              <span>Solicitar Datos</span>
            )}
          </button>
        </div>

        {/* State: IDLE */}
        {dataStatus === 'idle' && (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
            <p className="text-xs text-slate-500">
              Presione <strong className="text-slate-700">"Solicitar Datos"</strong> para consultar el endpoint seguro del servidor.
            </p>
          </div>
        )}

        {/* State: LOADING */}
        {dataStatus === 'loading' && (
          <div className="p-6 bg-slate-50 rounded-lg text-center flex flex-col items-center justify-center space-y-2">
            <svg className="animate-spin h-6 w-6 text-brand-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs text-slate-600 font-medium">Comunicando de forma segura con el servidor...</p>
          </div>
        )}

        {/* State: SUCCESS */}
        {dataStatus === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center">
                <span className="mr-1.5">✓</span> Datos obtenidos con éxito
              </span>
              <button
                type="button"
                onClick={loadDatos}
                className="text-[11px] text-emerald-700 hover:underline font-semibold"
              >
                Volver a consultar
              </button>
            </div>
            <div className="bg-white border border-emerald-100 rounded p-2.5 max-h-40 overflow-auto">
              <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap">
                {typeof datos === 'object' ? JSON.stringify(datos, null, 2) : String(datos)}
              </pre>
            </div>
          </div>
        )}

        {/* State: EMPTY DATA */}
        {dataStatus === 'empty_data' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center space-y-2">
            <p className="text-xs text-amber-800 font-medium">
              El servicio respondió correctamente pero no contiene datos registrados en este momento.
            </p>
            <button
              type="button"
              onClick={loadDatos}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-medium transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* State: KEY MISSING (500) */}
        {dataStatus === 'key_missing' && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-rose-600 text-base">⚠</span>
              <div className="text-xs text-rose-800">
                <p className="font-bold">Servidor requiere configuración</p>
                <p className="mt-0.5 text-rose-700">
                  {errorMessage || 'La API del servidor no está configurada.'}
                </p>
                <p className="mt-1 text-[11px] text-rose-600">
                  El administrador debe definir la variable de entorno <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">API_KEY</code> en el panel de Hostinger.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={loadDatos}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded font-medium transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* State: AUTH ERROR (502) */}
        {dataStatus === 'auth_error' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600 text-base">🔒</span>
              <div className="text-xs text-amber-800">
                <p className="font-bold">Autenticación rechazada</p>
                <p className="mt-0.5 text-amber-700">
                  {errorMessage || 'La API externa rechazó la autenticación.'}
                </p>
                <p className="mt-1 text-[11px] text-amber-600">
                  Verifique que la clave configurada en el servidor sea válida y cuente con los permisos necesarios.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={loadDatos}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-medium transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* State: TIMEOUT (504) */}
        {dataStatus === 'timeout' && (
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-slate-500 text-base">⏱</span>
              <div className="text-xs text-slate-700">
                <p className="font-bold">Tiempo de espera agotado</p>
                <p className="mt-0.5 text-slate-600">
                  {errorMessage || 'La API externa tardó demasiado en responder.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={loadDatos}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white text-xs rounded font-medium transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* State: NETWORK ERROR / OFFLINE */}
        {dataStatus === 'network_error' && (
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-slate-600 text-base">📡</span>
              <div className="text-xs text-slate-700">
                <p className="font-bold">Error de conexión</p>
                <p className="mt-0.5 text-slate-600">
                  {errorMessage || 'No se pudieron cargar los datos en este momento. Intenta nuevamente.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={loadDatos}
                className="px-3 py-1 bg-brand-primary hover:bg-brand-secondary text-white text-xs rounded font-medium transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* State: SERVICE UNAVAILABLE OR INVALID FORMAT */}
        {(dataStatus === 'service_unavailable' || dataStatus === 'invalid_format') && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-rose-600 text-base">⚠</span>
              <div className="text-xs text-rose-800">
                <p className="font-bold">Servicio no disponible</p>
                <p className="mt-0.5 text-rose-700">
                  {errorMessage || 'No se pudieron cargar los datos en este momento. Intenta nuevamente.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={loadDatos}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded font-medium transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>🔒 Arquitectura Segura Frontend + Backend</span>
        <span>Sin claves expuestas en el cliente</span>
      </div>
    </div>
  );
};

export default ApiDataStatusCard;
