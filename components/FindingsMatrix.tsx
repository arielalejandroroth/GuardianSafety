import React, { useState, useMemo } from 'react';
import { Finding, FindingStatus, FindingSource, RiskLevel, Attachment, ActionType } from '../types';
import Input from './common/Input';
import Select from './common/Select';
import Button from './common/Button';
import { PencilIcon, PaperClipIcon } from './IconComponents';
import EditFindingModal from './EditFindingModal';
import ViewAttachmentsModal from './ViewAttachmentsModal';
import { useAppContext } from '../contexts/AppContext';

interface FindingsMatrixProps {
  findings: Finding[];
}

const getStatusWithDelay = (finding: Finding): FindingStatus => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (finding.status !== FindingStatus.CUMPLIDO && finding.plannedDate) {
        const plannedDate = new Date(finding.plannedDate);
        if (plannedDate < now) {
            return FindingStatus.RETRASADO;
        }
    }
    return finding.status;
};

const StatusBadge: React.FC<{ status: FindingStatus }> = ({ status }) => {
  const statusClasses = {
    [FindingStatus.ABIERTO]: 'bg-blue-100 text-blue-800',
    [FindingStatus.EN_EJECUCION]: 'bg-amber-100 text-amber-800',
    [FindingStatus.CUMPLIDO]: 'bg-green-100 text-green-800',
    [FindingStatus.RETRASADO]: 'bg-red-100 text-red-800 animate-pulse',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

const FindingsMatrix: React.FC<FindingsMatrixProps> = ({ findings }) => {
  const { dispatch } = useAppContext();
  const [filterText, setFilterText] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterSectorResponsible, setFilterSectorResponsible] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Attachment[] | null>(null);

  const plants = useMemo(() => [...new Set(findings.map(f => f.plant))].sort(), [findings]);
  const sources = useMemo(() => [...new Set(findings.map(f => f.source))].sort(), [findings]);
  const sectorResponsibles = useMemo(() => [...new Set(findings.map(f => f.sectorResponsible))].sort(), [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      const searchText = filterText.toLowerCase();
      return (
        ((finding.deviation || '').toLowerCase().includes(searchText) || 
         (finding.actionResponsible || '').toLowerCase().includes(searchText) ||
         (finding.sector || '').toLowerCase().includes(searchText) ||
         (finding.sectorResponsible || '').toLowerCase().includes(searchText) ||
         (finding.id || '').toLowerCase().includes(searchText)) &&
        (filterPlant === '' || finding.plant === filterPlant) &&
        (filterSource === '' || finding.source === filterSource) &&
        (filterSectorResponsible === '' || finding.sectorResponsible === filterSectorResponsible)
      );
    });
  }, [findings, filterText, filterPlant, filterSource, filterSectorResponsible]);

  const handleEditClick = (finding: Finding) => {
    setEditingFinding(finding);
    setIsModalOpen(true);
  };
  
  const handleSaveChanges = (updatedFinding: Finding) => {
    dispatch({ type: ActionType.UPDATE_FINDING, payload: updatedFinding });
    setIsModalOpen(false);
    setEditingFinding(null);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-brand-dark mb-4">Matriz General de Desvíos y Hallazgos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-md border">
        <Input 
          label="Buscar por ID, Desvío, Sector..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Ej: F-001, guantes..."
        />
        <Select label="Filtrar por Planta" value={filterPlant} onChange={e => setFilterPlant(e.target.value)}>
          <option value="">Todas las Plantas</option>
          {plants.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Filtrar por Procedencia" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">Todas las Procedencias</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Filtrar por Resp. Sector" value={filterSectorResponsible} onChange={e => setFilterSectorResponsible(e.target.value)}>
          <option value="">Todos los Responsables</option>
          {sectorResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planta</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Detección</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedencia</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '250px'}}>Desvío</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riesgo</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp. Sector</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resp. Acción</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Plan.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">F. Real.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Adjuntos</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFindings.map(finding => {
                const displayStatus = getStatusWithDelay(finding);
                return (
                    <tr key={finding.id} className={displayStatus === FindingStatus.RETRASADO ? 'bg-red-50' : ''}>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{finding.id}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.plant}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.detectionDate}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.source}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-sm truncate" title={finding.deviation}>
                            {finding.deviation}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.riskLevel}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.sectorResponsible}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.actionResponsible}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.plannedDate}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{finding.realizedDate}</td>
                        <td className="px-3 py-4 whitespace-nowrap"><StatusBadge status={displayStatus} /></td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {finding.attachments && finding.attachments.length > 0 && (
                            <button 
                              onClick={() => setViewingAttachments(finding.attachments)} 
                              className="text-slate-500 hover:text-brand-primary transition-colors"
                              title={`Ver ${finding.attachments.length} adjunto(s)`}
                            >
                              <PaperClipIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="secondary" onClick={() => handleEditClick(finding)} size="sm">
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>

       {filteredFindings.length === 0 && (
          <div className="text-center py-10">
              <p className="text-gray-500">No se encontraron hallazgos con los filtros actuales.</p>
          </div>
        )}

      {isModalOpen && editingFinding && (
        <EditFindingModal 
            finding={editingFinding}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveChanges}
        />
      )}
      {viewingAttachments && (
        <ViewAttachmentsModal
          attachments={viewingAttachments}
          onClose={() => setViewingAttachments(null)}
        />
      )}
    </div>
  );
};

export default FindingsMatrix;