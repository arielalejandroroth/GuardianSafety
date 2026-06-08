import React, { useState, useCallback } from 'react';
import { ForkliftChecklist, ForkliftChecklistItem, Attachment } from '../types';
import { getInitialForkliftChecklistItems, FORKLIFT_CHECKLIST_STRUCTURE } from '../forkliftConstants';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Card from './common/Card';
import FileUpload from './common/FileUpload';

interface ForkliftChecklistFormProps {
  onSubmit: (data: Omit<ForkliftChecklist, 'id'>) => void;
  onCancel: () => void;
}

const initialFormState: Omit<ForkliftChecklist, 'id' | 'items' | 'hasFindings'> = {
  date: new Date().toISOString().split('T')[0],
  forkliftNumber: '',
  sector: '',
  controlledBy: '',
  responsibleSignature: '',
  authorized: '',
  generalObservations: '',
};

const ChecklistItemRow: React.FC<{
    item: ForkliftChecklistItem;
    onChange: (id: string, field: 'status' | 'observation', value: string) => void;
    onAttachmentChange: (id: string, attachments: Attachment[]) => void;
}> = ({ item, onChange, onAttachmentChange }) => {
    return (
        <div className="p-3 border-b border-slate-200 last:border-b-0">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <p className="md:col-span-1 font-medium text-slate-700">{item.item}</p>
                <div className="md:col-span-2 flex items-center justify-around space-x-2">
                    {['OK', 'NOK', 'N/A'].map(status => (
                        <label key={status} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-100">
                            <input
                                type="radio"
                                name={`status-${item.id}`}
                                value={status}
                                checked={item.status === status}
                                onChange={(e) => onChange(item.id, 'status', e.target.value)}
                                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                            />
                            <span className="font-semibold text-sm">{status}</span>
                        </label>
                    ))}
                </div>
            </div>
            {item.status === 'NOK' && (
                <div className="mt-3 pl-4 border-l-4 border-red-400 space-y-3">
                    <TextArea
                        label="Observación (Obligatorio si es 'NOK')"
                        value={item.observation}
                        onChange={(e) => onChange(item.id, 'observation', e.target.value)}
                        rows={2}
                        placeholder="Describa el hallazgo..."
                        required
                    />
                    <FileUpload onFilesChange={(files) => onAttachmentChange(item.id, files)} multiple />
                </div>
            )}
        </div>
    );
};

const ForkliftChecklistForm: React.FC<ForkliftChecklistFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [items, setItems] = useState<ForkliftChecklistItem[]>(getInitialForkliftChecklistItems());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleItemChange = useCallback((id: string, field: 'status' | 'observation', value: string) => {
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);
  
  const handleItemAttachmentChange = useCallback((id: string, attachments: Attachment[]) => {
      setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, attachments } : item));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { forkliftNumber, sector, controlledBy, responsibleSignature, authorized } = formData;
    
    if (!forkliftNumber.trim() || !sector.trim() || !controlledBy.trim() || !responsibleSignature.trim() || !authorized) {
        alert("Por favor, complete todos los campos de encabezado del checklist.");
        return;
    }
    
    const itemsWithoutStatus = items.filter(item => item.status === '');
    if (itemsWithoutStatus.length > 0) {
        alert(`Por favor, complete todos los ítems del checklist. Falta: ${itemsWithoutStatus[0].item}`);
        return;
    }
    
    const nokItemsWithNoObservation = items.filter(item => item.status === 'NOK' && item.observation.trim() === '');
    if (nokItemsWithNoObservation.length > 0) {
        alert(`Por favor, agregue una observación para todos los ítems marcados como "NOK". Falta en: ${nokItemsWithNoObservation[0].item}`);
        return;
    }

    const hasFindings = items.some(item => item.status === 'NOK');

    onSubmit({ ...formData, items, hasFindings });
  }, [formData, items, onSubmit]);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">CONTROL DIARIO PARA AUTOELEVADOR (RES 960/15)</h2>

        <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
            <h3 className="font-semibold text-slate-700">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Fecha del Control" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                <Input label="Autoelevador N°" name="forkliftNumber" value={formData.forkliftNumber} onChange={handleInputChange} required />
                <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} required />
            </div>
        </div>

        <div className="p-4 border rounded-lg bg-white space-y-2">
            {FORKLIFT_CHECKLIST_STRUCTURE.map(section => (
                <div key={section.category}>
                    <h3 className="text-md font-semibold text-white bg-yellow-500 p-2 rounded-t-md my-2">{section.category}</h3>
                    <div className="bg-slate-50 rounded-b-md">
                        {items.filter(i => i.category === section.category).map(item => (
                            <ChecklistItemRow key={item.id} item={item} onChange={handleItemChange} onAttachmentChange={handleItemAttachmentChange} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
            <TextArea label="Observaciones / Anexos Generales" name="generalObservations" value={formData.generalObservations} onChange={handleInputChange} rows={3} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Input label="Controlado por:" name="controlledBy" value={formData.controlledBy} onChange={handleInputChange} required placeholder="Nombre y Apellido"/>
                <Input label="Firma del responsable:" name="responsibleSignature" value={formData.responsibleSignature} onChange={handleInputChange} required placeholder="Nombre y Apellido"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700">Autoriza</label>
                <div className="mt-2 flex space-x-4">
                    {['SI', 'NO'].map(option => (
                        <label key={option} className="flex items-center space-x-2">
                            <input type="radio" name="authorized" value={option} checked={formData.authorized === option} onChange={handleInputChange} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300" />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" variant="primary">Guardar Control</Button>
        </div>
      </form>
    </Card>
  );
};

export default ForkliftChecklistForm;
