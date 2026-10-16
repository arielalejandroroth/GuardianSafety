import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import { getGeminiApiKey, setGeminiApiKey } from '../services/geminiClientFallback';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({
    type: null,
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setStatus({ type: null, message: '' });
    }
  }, [isOpen]);

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    setStatus({
      type: 'success',
      message: apiKey.trim() 
        ? '¡Clave guardada exitosamente en este navegador!' 
        : 'Clave eliminada. Se usará el backend si está disponible.'
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim() || getGeminiApiKey();
    if (!keyToTest) {
      setStatus({ type: 'error', message: 'Por favor ingresa primero la clave de API para probarla.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Verificando clave con Google Gemini...' });
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(keyToTest)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde solo la palabra: OK' }] }]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setGeminiApiKey(keyToTest);
        setStatus({ type: 'success', message: '¡Conexión exitosa! La clave es válida y está lista para usarse.' });
      } else {
        throw new Error('Respuesta inesperada de la API');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Fallo de conexión: ${err.message}` });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración de Inteligencia Artificial (Gemini)">
      <div className="space-y-4 text-sm text-slate-700">
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sky-900 text-xs">
          <p className="font-semibold mb-1">ℹ️ Modo Hosting Estático / Hostinger</p>
          <p>
            Si tu servidor en Hostinger está configurado en modo estático (sin proceso Node.js activo), 
            la IA funciona <strong>directamente desde tu navegador</strong> conectándose a Google Gemini.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Clave de API de Gemini (Google AI Studio)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Pega aquí tu clave (AQ.Ab8... o AIzaSy...)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary font-mono text-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Tu clave se guarda únicamente en tu navegador de forma segura.
          </p>
        </div>

        {status.message && (
          <div
            className={`p-2.5 rounded-lg text-xs font-medium ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : status.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleTestConnection}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            🔍 Probar Conexión
          </button>

          <div className="flex space-x-2">
            <Button variant="secondary" onClick={onClose} className="!px-3 !py-1.5 text-xs">
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} className="!px-3 !py-1.5 text-xs">
              Guardar Clave
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
