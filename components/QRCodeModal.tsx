import React, { useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Modal from './common/Modal';
import Button from './common/Button';
import { WhatsappIcon, CopyIcon } from './IconComponents';

interface QRCodeModalProps {
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copiar Enlace');
  
  const appUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopyButtonText('¡Copiado!');
      setTimeout(() => setCopyButtonText('Copiar Enlace'), 2000);
    });
  }, [appUrl]);
  
  const handleWhatsAppShare = () => {
      const message = encodeURIComponent(`Accede a la app de seguridad SafetyGuard Pro aquí: ${appUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Compartir Aplicación">
      <div className="flex flex-col items-center text-center">
        <p className="mb-4 text-gray-600">
          Escanea este código QR con tu smartphone para acceder a la aplicación directamente.
        </p>
        <div className="p-4 bg-white rounded-lg border">
          <QRCodeCanvas
            value={appUrl}
            size={256}
            level={"H"}
            includeMargin={true}
          />
        </div>
        <p className="mt-4 text-sm text-gray-500 break-all">{appUrl}</p>
        
        <div className="mt-6 w-full space-y-3">
            <Button onClick={handleWhatsAppShare} variant="primary" className="w-full bg-green-500 hover:bg-green-600 focus:ring-green-500">
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