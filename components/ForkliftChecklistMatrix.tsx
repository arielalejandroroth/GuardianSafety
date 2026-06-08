import React, { useState, useMemo } from 'react';
import { ForkliftChecklist, View, Attachment } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import Card from './common/Card';
import { DocumentAddIcon, PaperClipIcon } from './IconComponents';
import ViewAttachmentsModal from './ViewAttachmentsModal';

interface ForkliftChecklistMatrixProps {
  checklists: ForkliftChecklist[];
  onNavigate: (view: View) => void;
}

const ForkliftChecklistMatrix: React.FC<ForkliftChecklistMatrixProps> = ({ checklists, onNavigate }) => {
  const [filterText, setFilterText] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewingAttachments, setViewingAttachments] = useState<Attachment[] | null>(null);
  
  const sortedChecklists = useMemo(() => {
    return [...checklists].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checklists]);

  const filteredChecklists = useMemo(() => {
    return sortedChecklists.filter(c => {
      const searchText = filterText.toLowerCase();
      return (
        (c.id || '').toLowerCase().includes(searchText) ||
        (c.forkliftNumber || '').toLowerCase().includes(searchText) ||
        (c.sector || '').toLowerCase().includes(searchText) ||
        (c.controlledBy || '').toLowerCase().includes(searchText)
      );
    });
  }, [sortedChecklists, filterText]);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('es-AR');
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-800">RES 960/15 - Historial de Controles</h2>
        <Button variant="primary" onClick={() => onNavigate(View.FORKLIFT_CHECKLIST_FORM)}>
          <DocumentAddIcon className="h-5 w-5 mr-2" />
          Registrar Nuevo Control
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
        <Input 
          label="Buscar por N°, ID, Sector..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Ej: C-001, 12..."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autoelevador N°</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controlado por</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autorizado</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hallazgos</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredChecklists.map(c => (
              <React.Fragment key={c.id}>
                <tr className={c.hasFindings ? 'bg-red-50 hover:bg-red-100' : ''}>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.id}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(c.date)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{c.forkliftNumber}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{c.sector}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{c.controlledBy}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold">{c.authorized}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-bold">{c.hasFindings ? 'SI' : 'NO'}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    {c.hasFindings && (
                      <Button size="sm" onClick={() => toggleRowExpansion(c.id)}>
                        {expandedRows.has(c.id) ? 'Ocultar' : 'Ver Detalles'}
                      </Button>
                    )}
                  </td>
                </tr>
                {expandedRows.has(c.id) && c.hasFindings && (
                  <tr className="bg-slate-50">
                    <td colSpan={8} className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-800">Detalle de Hallazgos:</h4>
                        {c.items.filter(item => item.status === 'NOK').map(finding => (
                          <div key={finding.id} className="p-3 border rounded-md bg-white">
                            <p className="font-medium text-slate-700">{finding.item}</p>
                            <p className="text-sm text-slate-600 mt-1 pl-4 border-l-2 border-slate-200">
                              <span className="font-semibold">Observación:</span> {finding.observation}
                            </p>
                            {finding.attachments.length > 0 && (
                                <button
                                    onClick={() => setViewingAttachments(finding.attachments)}
                                    className="text-sm text-brand-primary hover:underline flex items-center mt-2"
                                >
                                    <PaperClipIcon className="h-4 w-4 mr-1" />
                                    Ver adjunto(s) ({finding.attachments.length})
                                </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
       {filteredChecklists.length === 0 && (
          <div className="text-center py-10">
              <p className="text-gray-500">No se encontraron controles registrados.</p>
          </div>
      )}

      {viewingAttachments && (
        <ViewAttachmentsModal
          attachments={viewingAttachments}
          onClose={() => setViewingAttachments(null)}
        />
      )}
    </Card>
  );
};

export default ForkliftChecklistMatrix;