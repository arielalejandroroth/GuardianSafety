import React, { useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Modal from './common/Modal';
import Button from './common/Button';
import { WhatsappIcon, CopyIcon, ShieldCheckIcon, CheckCircleIcon } from './IconComponents';
import { getAppShareUrl } from '../utils/storage';

interface QRCodeModalProps {
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copiar Enlace');

  // Dynamically uses Hostinger / custom domain in production, or canonical shared URL in dev
  const appUrl = getAppShareUrl();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopyButtonText('¡Copiado!');
      setTimeout(() => setCopyButtonText('Copiar Enlace'), 2000);
    });
  }, [appUrl]);

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Accede a la app de Seguridad e Higiene SafetyGuard Pro aquí:\n${appUrl}\n\nIngresa con tu correo autorizado (ej: carlafernandxz@gmail.com) o con tu cuenta de Google.`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Compartir Aplicación con Usuarios Designados">
      <div className="flex flex-col items-center text-center">
        {/* Security badge */}
        <div className="mb-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
          Enlace Oficial de Producción (Código y Backoffice Protegidos)
        </div>

        <p className="mb-3 text-xs sm:text-sm text-slate-600 max-w-sm">
          Escanea el código QR o comparte el enlace. Los usuarios ingresarán a la interfaz operativa funcional y
          <strong> no podrán ver ni modificar el código ni la configuración</strong>.
        </p>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-md">
          <QRCodeCanvas
            value={appUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 w-full">
          <p className="text-xs font-mono text-slate-700 break-all select-all font-medium">
            {appUrl}
          </p>
        </div>

        {/* Instructions for mobile & WhatsApp users */}
        <div className="mt-3 text-left w-full bg-blue-50/70 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 space-y-1.5">
          <div className="font-semibold flex items-center">
            <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Acceso para Personal Designado (ej: Carla Fernández):
          </div>
          <p className="text-slate-600">
            Los usuarios designados ingresan directamente introduciendo su correo corporativo autorizado.
          </p>
          <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <strong>⚠️ ¿El usuario ve Error 403 de Google?</strong><br />
            Para permitirle entrar, ve al botón <strong>"Share" (Compartir)</strong> en la esquina superior derecha de AI Studio y añade su correo (<code>carlafernandxz@gmail.com</code>) como <strong>Viewer (Lector)</strong>. Así podrá usar la app sin ver el código.
          </div>
        </div>

        <div className="mt-4 w-full space-y-2">
          <Button
            onClick={handleWhatsAppShare}
            variant="primary"
            className="w-full !bg-emerald-600 hover:!bg-emerald-700 focus:ring-emerald-500"
          >
            <WhatsappIcon className="h-5 w-5 mr-2" />
            Compartir por WhatsApp
          </Button>
          <Button onClick={handleCopy} variant="secondary" className="w-full">
            <CopyIcon className="h-5 w-5 mr-2" />
            {copyButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;