import React, { useState, useMemo, useEffect } from 'react';
import { Qualification, Equipment, View, QualificationStatus } from '../types';
import Input from './common/Input';
import Select from './common/Select';
import Button from './common/Button';
import { DocumentAddIcon, PencilIcon, DocumentDuplicateIcon, IdCardIcon } from './IconComponents';
import ViewQualificationCardModal from './ViewQualificationCardModal';

// Helper function to determine qualification status
const getStatusForDate = (expiryDateStr: string): QualificationStatus => {
    if (!expiryDateStr) return QualificationStatus.VIGENTE;

    const now = new Date();
    // Create a UTC date for today at midnight to ensure consistent comparisons across timezones
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const expiryDateParts = expiryDateStr.split('-').map(part => parseInt(part, 10));
    if (expiryDateParts.length !== 3 || expiryDateParts.some(isNaN)) {
        return QualificationStatus.VIGENTE; // Handle malformed date string
    }
    // Create a UTC date for the expiry date at midnight
    const expiryDate = new Date(Date.UTC(expiryDateParts[0], expiryDateParts[1] - 1, expiryDateParts[2]));

    // If expiry date is before today, it's expired.
    if (expiryDate.getTime() < today.getTime()) {
        return QualificationStatus.VENCIDO;
    }
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);
    
    // If expiry date is within the next 30 days (inclusive of today)
    if (expiryDate.getTime() <= thirtyDaysFromNow.getTime()) {
        return QualificationStatus.PROXIMO_A_VENCER;
    }
    
    return QualificationStatus.VIGENTE;
};

// Helper component for the status badge
const QualificationStatusBadge: React.FC<{ status: QualificationStatus }> = ({ status }) => {
  const statusClasses = {
    [QualificationStatus.VIGENTE]: 'bg-green-100 text-green-800',
    [QualificationStatus.PROXIMO_A_VENCER]: 'bg-yellow-100 text-yellow-800',
    [QualificationStatus.VENCIDO]: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

interface QualificationsMatrixProps {
  qualifications: Qualification[];
  onNavigate: (view: View) => void;
  onEdit: (qualification: Qualification) => void;
}

const ITEMS_PER_PAGE = 20;

const QualificationsMatrix: React.FC<QualificationsMatrixProps> = ({ qualifications, onNavigate, onEdit }) => {
  const [filterText, setFilterText] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingQualification, setViewingQualification] = useState<Qualification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const equipmentTypes = useMemo(() => Object.values(Equipment), []);

  const sortedQualifications = useMemo(() => {
    return [...qualifications].sort((a, b) => a.personnelName.localeCompare(b.personnelName));
  }, [qualifications]);

  const filteredQualifications = useMemo(() => {
    return sortedQualifications.filter(q => {
      const searchText = filterText.toLowerCase();
      const qualStatus = getStatusForDate(q.expiryDate);
      return (
        ((q.personnelName || '').toLowerCase().includes(searchText) || 
         (q.personnelId || '').toLowerCase().includes(searchText) || 
         (q.supervisor || '').toLowerCase().includes(searchText)
        ) &&
        (filterEquipment === '' || q.equipment === filterEquipment) &&
        (filterStatus === '' || qualStatus === filterStatus)
      );
    });
  }, [sortedQualifications, filterText, filterEquipment, filterStatus]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterEquipment, filterStatus]);

  const totalPages = Math.ceil(filteredQualifications.length / ITEMS_PER_PAGE);
  
  const paginatedQualifications = useMemo(() => {
    return filteredQualifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredQualifications, currentPage]);


  const handleViewClick = (qualification: Qualification) => {
    setViewingQualification(qualification);
  };
  
  const formatDate = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  }
  
  const getRowClass = (status: QualificationStatus) => {
    switch (status) {
        case QualificationStatus.VENCIDO:
            return 'text-status-danger';
        case QualificationStatus.VIGENTE:
            return 'text-status-safe';
        case QualificationStatus.PROXIMO_A_VENCER:
            return 'text-yellow-600';
        default:
            return '';
    }
  };


  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-brand-dark">Habilitaciones de Equipos Especiales</h2>
        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => onNavigate(View.QUALIFICATION_CARDS_GALLERY)}>
              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
              Ver Carnets
            </Button>
            <Button variant="primary" onClick={() => onNavigate(View.QUALIFICATION_FORM)}>
              <DocumentAddIcon className="h-5 w-5 mr-2" />
              Agregar Habilitación
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-md border">
        <Input 
          label="Buscar por Nombre, Legajo o Supervisor..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Ej: Gomez, 58215..."
        />
        <Select label="Filtrar por Equipo" value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}>
          <option value="">Todos los Equipos</option>
          {equipmentTypes.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
        <Select label="Filtrar por Estado de Habilitación" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los Estados</option>
          {Object.values(QualificationStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legajo</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venc. Habilitación</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Habil.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venc. Psicofísico</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Psicof.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apto Médico</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedQualifications.map(q => {
                const qualStatus = getStatusForDate(q.expiryDate);
                const psychoStatus = getStatusForDate(q.psychophysicalExpiryDate);
                const rowClass = getRowClass(qualStatus);

                return (
                    <tr key={q.id} className={rowClass}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">{q.personnelName}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{q.personnelId}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{q.supervisor}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{q.equipment}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{formatDate(q.expiryDate)}</td>
                        <td className="px-3 py-4 whitespace-nowrap"><QualificationStatusBadge status={qualStatus} /></td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{formatDate(q.psychophysicalExpiryDate)}</td>
                        <td className="px-3 py-4 whitespace-nowrap"><QualificationStatusBadge status={psychoStatus} /></td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{q.medicalCheckupStatus}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                                <Button variant="secondary" onClick={() => handleViewClick(q)} size="sm" title="Ver Carnet">
                                    <IdCardIcon className="h-4 w-4 mr-1" />
                                    Carnet
                                </Button>
                                <Button variant="secondary" onClick={() => onEdit(q)} size="sm" className="!p-2" title="Editar Habilitación">
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-slate-600">
            Mostrando {paginatedQualifications.length} de {filteredQualifications.length} registros
        </span>
        <div className="flex items-center gap-2">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} size="sm">
                Anterior
            </Button>
            <span className="text-sm text-slate-700 font-medium">
                Página {currentPage} de {totalPages}
            </span>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} size="sm">
                Siguiente
            </Button>
        </div>
      </div>

       {filteredQualifications.length === 0 && (
          <div className="text-center py-10">
              <p className="text-gray-500">No se encontraron habilitaciones con los filtros actuales.</p>
          </div>
        )}
        
        {viewingQualification && (
            <ViewQualificationCardModal
                qualification={viewingQualification}
                onClose={() => setViewingQualification(null)}
            />
        )}
    </div>
  );
};

export default QualificationsMatrix;