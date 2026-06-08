import React, { useRef } from 'react';
import { Qualification, Equipment, Attachment, MedicalStatus } from '../types';
import { PrintIcon, ForkliftIcon, HarnessIcon, GrinderIcon, CraneIcon, FlameIcon, SnowflakeIcon, UserCircleIcon, ShieldCheckIcon } from './IconComponents';
import Button from './common/Button';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { swiftLogoBase64 } from '../assets/logo';

interface QualificationCardProps {
    qualification: Qualification;
}

export const getEquipmentTheme = (equipment: Equipment) => {
    switch (equipment) {
        case Equipment.AUTOELEVADOR:
        case Equipment.CARRETILLA_ELECTRICA:
            return { color: 'bg-red-600', textColor: 'text-red-600', Icon: ForkliftIcon, title: 'Conductor' };
        case Equipment.TRABAJO_ALTURA:
            return { color: 'bg-sky-600', textColor: 'text-sky-600', Icon: HarnessIcon, title: 'Operador' };
        case Equipment.AMOLADORA:
            return { color: 'bg-slate-600', textColor: 'text-slate-600', Icon: GrinderIcon, title: 'Operador' };
        case Equipment.PUENTE_GRUA:
            return { color: 'bg-amber-600', textColor: 'text-amber-600', Icon: CraneIcon, title: 'Operador' };
        case Equipment.FOGUISTA:
            return { color: 'bg-orange-600', textColor: 'text-orange-600', Icon: FlameIcon, title: 'Operador' };
        case Equipment.FRIGORISTA:
            return { color: 'bg-blue-600', textColor: 'text-blue-600', Icon: SnowflakeIcon, title: 'Operador' };
        default:
            return { color: 'bg-gray-600', textColor: 'text-gray-600', Icon: UserCircleIcon, title: 'Operador' };
    }
};

const Avatar: React.FC<{ photo?: Attachment, name: string }> = ({ photo, name }) => {
    const containerClasses = "w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center";

    if (photo) {
        return <img src={`data:${photo.type};base64,${photo.data}`} alt={name} className={containerClasses} />;
    }
    
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className={containerClasses}>
            <span className="text-4xl font-bold text-slate-500">{initials}</span>
        </div>
    );
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    date.setUTCHours(12); // Avoid timezone shifts at midnight
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

const DetailItem: React.FC<{label: string, value: string, valueClassName?: string}> = ({label, value, valueClassName = ''}) => (
    <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`font-bold text-slate-800 ${valueClassName}`}>{value}</p>
    </div>
);


const QualificationCard: React.FC<QualificationCardProps> = ({ qualification }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const theme = getEquipmentTheme(qualification.equipment);
    
    const appUrl = `${window.location.origin}${window.location.pathname}?view=qualification_details&id=${qualification.id}`;
    
    const handlePrint = () => {
        const node = cardRef.current;
        if(node) {
            node.classList.add('printable-area');
            window.print();
            node.classList.remove('printable-area');
        }
    };

    return (
        <div className="flex flex-col">
            <div ref={cardRef} className="qualification-card-body w-[375px] bg-white mx-auto font-sans shadow-xl rounded-xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className={`relative ${theme.color} p-4 text-white`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <img src={swiftLogoBase64} alt="Swift Logo" className="w-10 h-10" />
                           <span className="font-bold text-xl">Swift Argentina S.A.</span>
                        </div>
                    </div>
                </div>
                
                {/* Angled separator & Avatar */}
                <div className="relative h-20 bg-slate-100">
                   <div className={`absolute bottom-0 w-full h-full ${theme.color}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 100%)' }}></div>
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <Avatar photo={qualification.personnelPhoto} name={qualification.personnelName} />
                    </div>
                </div>
                
                {/* Main content */}
                <div className="bg-slate-100 px-6 pb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">{qualification.personnelName}</h2>
                    <p className="text-slate-500">Legajo: {qualification.personnelId}</p>
                </div>

                <div className="px-6 py-4 space-y-4">
                    <h3 className="text-center font-bold text-lg text-brand-secondary uppercase border-b-2 border-brand-secondary/20 pb-2">
                        {qualification.equipment}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Sector" value={qualification.sector || 'N/A'} />
                        <DetailItem 
                            label="Apto Médico" 
                            value={qualification.medicalCheckupStatus}
                            valueClassName={qualification.medicalCheckupStatus !== MedicalStatus.APTO ? 'text-amber-600' : 'text-green-600'}
                        />
                         <DetailItem label="Vence Habilitación" value={formatDate(qualification.expiryDate)} />
                         <DetailItem label="Vence Psicofísico" value={formatDate(qualification.psychophysicalExpiryDate)} />
                    </div>
                </div>

                {/* Footer with QR */}
                <div className="bg-white p-4 flex items-center justify-between border-t border-slate-200">
                    <div className="flex items-center gap-3">
                         <div className="p-1 bg-white border rounded-md">
                            <QRCode
                                value={appUrl}
                                size={60}
                                level={"M"}
                                includeMargin={false}
                            />
                        </div>
                        <div>
                            <p className='text-xs font-semibold text-slate-600'>Verificar habilitación online</p>
                             <p className='text-xs text-slate-400'>Escanear código QR</p>
                        </div>
                    </div>
                    <ShieldCheckIcon className="w-10 h-10 text-green-500" />
                </div>
            </div>
            
             <div className="text-center mt-4 no-print">
                <Button onClick={handlePrint} size="sm" variant="secondary">
                    <PrintIcon className="w-4 h-4 mr-1" />
                    Imprimir
                </Button>
            </div>
        </div>
    );
};

export default QualificationCard;
