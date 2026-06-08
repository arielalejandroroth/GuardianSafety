import React, { useState, useCallback } from 'react';
import { InternalAuditFormState, AuditChecklistItem, Attachment } from '../types';
import { AUDIT_CHECKLIST_ITEMS } from '../auditConstants';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import { ChevronDownIcon } from './IconComponents';
import FileUpload from './common/FileUpload';

interface InternalAuditFormProps {
  onSubmit: (data: InternalAuditFormState) => void;
  onCancel: () => void;
}

const initialFormState: InternalAuditFormState = {
  plant: 'ROS',
  process: '',
  area: '',
  puesto: '',
  sector: '',
  supervisor: '',
  operatorCount: '',
  date: new Date().toISOString().split('T')[0],
  auditLead: '',
  auditTeam: '',
  checklist: AUDIT_CHECKLIST_ITEMS.map(item => ({ ...item, status: '', comment: '', attachments: [] })),
  attachments: [],
  auditLeadSignature: '',
  supervisorSignature: '',
};

const Section: React.FC<{ title: string; children: React.ReactNode, initiallyOpen?: boolean }> = ({ title, children, initiallyOpen = true }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-lg font-semibold text-brand-dark">
        {title}
        <ChevronDownIcon className={`h-6 w-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
};

const InternalAuditForm: React.FC<InternalAuditFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<InternalAuditFormState>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (id: string, field: 'status' | 'comment', value: string) => {
    setFormData(prev => ({
        ...prev,
        checklist: prev.checklist.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  }

  const handleChecklistAttachmentChange = (id: string, attachments: Attachment[]) => {
    setFormData(prev => ({
        ...prev,
        checklist: prev.checklist.map(item => item.id === id ? { ...item, attachments } : item)
    }));
  }
  
  const handleFileChange = useCallback((attachments: Attachment[]) => {
      setFormData(prev => ({ ...prev, attachments }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const { date, sector, supervisor, auditLead, process, plant, auditLeadSignature, supervisorSignature } = formData;
    const validationErrors: string[] = [];

    if (!plant.trim() || !date || !sector.trim() || !supervisor.trim() || !auditLead.trim() || !process.trim()) {
        validationErrors.push('Todos los campos de "Información General de la Auditoría" son obligatorios.');
    }

    if (!auditLeadSignature.trim() || !supervisorSignature.trim()) {
        validationErrors.push('Las firmas del auditor líder y del supervisor son obligatorias.');
    }

    const deviations = formData.checklist.filter(item => item.status === 'No');
    if (deviations.some(d => d.comment.trim() === '')) {
        validationErrors.push('Cada ítem marcado como "No" debe tener un comentario o hallazgo descrito.');
    }

    if (validationErrors.length > 0) {
        alert('Por favor, corrija los siguientes errores:\n\n- ' + validationErrors.join('\n- '));
        return;
    }

    onSubmit(formData);
  }, [formData, onSubmit]);

  const checklistByCategory = formData.checklist.reduce((acc, item) => {
    const category = item.category || 'Sin Categoría';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, AuditChecklistItem[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-dark">Planilla de Auditoría Interna</h2>

      <Section title="1. Información General de la Auditoría">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Planta" name="plant" value={formData.plant} onChange={handleInputChange} required />
            <Input label="Proceso" name="process" value={formData.process} onChange={handleInputChange} required />
            <Input label="Área" name="area" value={formData.area} onChange={handleInputChange} required />
            <Input label="Puesto" name="puesto" value={formData.puesto} onChange={handleInputChange} required />
            <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} required />
            <Input label="Supervisor / Jefe" name="supervisor" value={formData.supervisor} onChange={handleInputChange} required />
            <Input label="Líder de Auditoría" name="auditLead" value={formData.auditLead} onChange={handleInputChange} required />
            <Input label="Fecha" type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            <Input label="N° de Operarios" name="operatorCount" value={formData.operatorCount} onChange={handleInputChange} type="number" />
            <div className="md:col-span-3">
                <TextArea label="Equipo Auditor (Nombres)" name="auditTeam" value={formData.auditTeam} onChange={handleInputChange} rows={2} />
            </div>
            <div className="md:col-span-3">
                <FileUpload onFilesChange={handleFileChange} multiple />
            </div>
        </div>
      </Section>
      
      <Section title="2. Checklist de Auditoría" initiallyOpen={true}>
        {/* FIX: Replaced Object.entries with Object.keys to ensure proper type inference for the 'items' array, resolving the '.map is not a function' error on 'unknown' type. */}
        {Object.keys(checklistByCategory).map((category) => {
          const items = checklistByCategory[category];
          return (
            <div key={category} className="pt-4 border-t first:border-t-0">
                <h3 className="text-md font-semibold text-brand-secondary mb-2">{category}</h3>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-md border">
                           <p className="font-medium text-gray-800">{item.question}</p>
                           <p className="text-xs text-gray-500 mb-2">Normativa: {item.regulation}</p>
                           <div className="flex items-center space-x-4 mb-2">
                               {['Si', 'No', 'N/A'].map(status => (
                                   <label key={status} className="flex items-center">
                                       <input
                                            type="radio"
                                            name={`status-${item.id}`}
                                            value={status}
                                            checked={item.status === status}
                                            onChange={(e) => handleChecklistChange(item.id, 'status', e.target.value)}
                                            className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300"
                                       />
                                       <span className="ml-2 text-gray-700">{status}</span>
                                   </label>
                               ))}
                           </div>
                           {item.status === 'No' && (
                               <div className="mt-2 space-y-3">
                                   <TextArea
                                        label="Comentario / Hallazgo (Obligatorio si es 'No')"
                                        value={item.comment}
                                        onChange={(e) => handleChecklistChange(item.id, 'comment', e.target.value)}
                                        rows={2}
                                        placeholder="Describa el hallazgo detectado..."
                                        required
                                   />
                                   <FileUpload onFilesChange={(files) => handleChecklistAttachmentChange(item.id, files)} multiple />
                               </div>
                           )}
                        </div>
                    ))}
                </div>
            </div>
          );
        })}
      </Section>
      
      <Section title="3. Firmas de Conformidad" initiallyOpen={true}>
        <p className="text-sm text-slate-600 mb-4">
            La firma digital (ingreso del nombre completo) de las partes involucradas confirma la realización de la auditoría y la conformidad con los hallazgos registrados.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label="Firma Auditor Líder" 
                name="auditLeadSignature" 
                value={formData.auditLeadSignature} 
                onChange={handleInputChange} 
                required 
                placeholder="Nombre completo del auditor líder"
            />
            <Input 
                label="Firma Supervisor/Jefe del Área" 
                name="supervisorSignature" 
                value={formData.supervisorSignature} 
                onChange={handleInputChange} 
                required 
                placeholder="Nombre completo del responsable del área"
            />
        </div>
      </Section>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Finalizar y Guardar Auditoría</Button>
      </div>
    </form>
  );
};

export default InternalAuditForm;