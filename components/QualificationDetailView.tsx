import React from 'react';
import { Qualification, QualificationStatus, View, Attachment } from '../types';
import { getEquipmentTheme } from './QualificationCard';
import Button from './common/Button';
import { ShieldCheckIcon } from './IconComponents';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 text-right font-semibold">{value}</dd>
    </div>
);

const getStatusForDate = (expiryDateStr: string): QualificationStatus => {
    if (!expiryDateStr) return QualificationStatus.VIGENTE;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const expiryDateParts = expiryDateStr.split('-').map(part => parseInt(part, 10));
    const expiryDate = new Date(expiryDateParts[0], expiryDateParts[1] - 1, expiryDateParts[2]);
    expiryDate.setHours(0,0,0,0);

    if (expiryDate < now) {
        return QualificationStatus.VENCIDO;
    }
    
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    if (expiryDate <= thirtyDaysFromNow) {
        return QualificationStatus.PROXIMO_A_VENCER;
    }
    
    return QualificationStatus.VIGENTE;
};

const QualificationStatusBadge: React.FC<{ status: QualificationStatus }> = ({ status }) => {
  const statusClasses = {
    [QualificationStatus.VIGENTE]: 'bg-green-100 text-green-800',
    [QualificationStatus.PROXIMO_A_VENCER]: 'bg-yellow-100 text-yellow-800',
    [QualificationStatus.VENCIDO]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 ml-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    // Create date from YYYY-MM-DD string to avoid timezone issues. This treats the date as UTC.
    const dateParts = dateStr.split('-').map(part => parseInt(part, 10));
    const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    return date.toLocaleDateString('es-AR', { timeZone: 'UTC' });
}

const Avatar: React.FC<{ photo?: Attachment, name: string }> = ({ photo, name }) => {
    const containerClasses = "w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center mx-auto";

    if (photo) {
        return <img src={`data:${photo.type};base64,${photo.data}`} alt={name} className={containerClasses} />;
    }
    
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
        <div className={containerClasses}>
            <span className="text-3xl font-bold text-slate-500">{initials}</span>
        </div>
    );
};


interface QualificationDetailViewProps {
  qualification: Qualification;
}

const QualificationDetailView: React.FC<QualificationDetailViewProps> = ({ qualification }) => {
    const theme = getEquipmentTheme(qualification.equipment);
    const qualStatus = getStatusForDate(qualification.expiryDate);
    const psychoStatus = getStatusForDate(qualification.psychophysicalExpiryDate);

    return (
        <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className={`p-4 text-white text-center ${theme.color}`}>
                <ShieldCheckIcon className="h-12 w-12 mx-auto" />
                <h2 className="text-2xl font-bold uppercase mt-2">Habilitación Verificada</h2>
            </div>
            <div className="p-6 relative">
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <Avatar photo={qualification.personnelPhoto} name={qualification.personnelName} />
                </div>
                <div className="text-center mt-12 mb-6">
                    <h3 className="text-xl font-bold text-gray-800">{qualification.personnelName}</h3>
                    <p className="text-gray-500">Legajo: {qualification.personnelId}</p>
                </div>

                <dl>
                    <DetailRow label="Equipo Habilitado" value={qualification.equipment} />
                    <DetailRow label="Apto Médico General" value={qualification.medicalCheckupStatus} />
                    <DetailRow label="Venc. Habilitación" value={<div className="flex items-center justify-end">{formatDate(qualification.expiryDate)} <QualificationStatusBadge status={qualStatus} /></div>} />
                    <DetailRow label="Venc. Psicofísico" value={<div className="flex items-center justify-end">{formatDate(qualification.psychophysicalExpiryDate)} <QualificationStatusBadge status={psychoStatus} /></div>} />
                </dl>
                 <p className="text-center text-xs text-gray-400 mt-6">
                    Verificado por SafetyGuard Pro a las {new Date().toLocaleTimeString('es-AR')}.
                </p>
            </div>
        </div>
    );
};

export default QualificationDetailView;