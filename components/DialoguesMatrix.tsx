import React, { useState, useMemo } from 'react';
import { DialogueFormState, DialogueType, Attachment } from '../types';
import Input from './common/Input';
import Select from './common/Select';
import { PaperClipIcon } from './IconComponents';
import Card from './common/Card';
import ViewAttachmentsModal from './ViewAttachmentsModal';

interface DialoguesMatrixProps {
  dialogues: DialogueFormState[];
}

const DialoguesMatrix: React.FC<DialoguesMatrixProps> = ({ dialogues }) => {
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [viewingAttachments, setViewingAttachments] = useState<Attachment[] | null>(null);

  const sortedDialogues = useMemo(() => {
    return [...dialogues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dialogues]);
  
  const filteredDialogues = useMemo(() => {
    return sortedDialogues.filter(dialogue => {
      const searchText = filterText.toLowerCase();
      const matchesText = (
        (dialogue.topics || '').toLowerCase().includes(searchText) ||
        (dialogue.supervisor || '').toLowerCase().includes(searchText) ||
        (dialogue.sector || '').toLowerCase().includes(searchText)
      );
      const matchesType = filterType === '' || dialogue.type === filterType;
      const matchesDate = filterDate === '' || dialogue.date === filterDate;
      
      return matchesText && matchesType && matchesDate;
    });
  }, [sortedDialogues, filterText, filterType, filterDate]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('es-AR');
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Historial de Diálogos de Seguridad</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
        <Input 
          label="Buscar por Tema, Líder, Sector..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Ej: EPP, Juan Perez..."
        />
        <Select label="Filtrar por Tipo" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos los Tipos</option>
          {Object.values(DialogueType).map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input 
          label="Filtrar por Fecha"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Líder</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temas Tratados</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjuntos</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDialogues.map(dialogue => (
              <tr key={dialogue.id}>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(dialogue.date)}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{dialogue.type}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{dialogue.sector}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{dialogue.supervisor}</td>
                <td className="px-3 py-4 text-sm text-gray-500 max-w-md" title={dialogue.topics}>
                    <p className="truncate">{dialogue.topics}</p>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center">
                    {dialogue.attachments && dialogue.attachments.length > 0 && (
                        <button onClick={() => setViewingAttachments(dialogue.attachments)} className="text-brand-primary hover:text-brand-secondary">
                            <PaperClipIcon className="h-5 w-5" />
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredDialogues.length === 0 && (
          <div className="text-center py-10">
              <p className="text-gray-500">No se encontraron diálogos con los filtros actuales.</p>
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

export default DialoguesMatrix;