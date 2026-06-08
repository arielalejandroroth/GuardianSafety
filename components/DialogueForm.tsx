

import React, { useState, useCallback } from 'react';
import { DialogueFormState, DialogueType, Attachment } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import TextArea from './common/TextArea';
import FileUpload from './common/FileUpload';

interface DialogueFormProps {
  onSubmit: (data: DialogueFormState) => void;
  onCancel: () => void;
}

const initialFormState: DialogueFormState = {
  id: '',
  type: DialogueType.DDS,
  date: new Date().toISOString().split('T')[0],
  sector: '',
  participants: '',
  supervisor: '',
  topics: '',
  attachments: [],
};

const DialogueForm: React.FC<DialogueFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<DialogueFormState>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = useCallback((attachments: Attachment[]) => {
      setFormData(prev => ({ ...prev, attachments }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sector || !formData.supervisor || !formData.topics) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }
    onSubmit({ ...formData, id: `D-${Date.now()}` });
  }, [formData, onSubmit]);

  return (
    <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-brand-dark">Registro de Diálogo de Seguridad</h2>

        <Select label="Tipo de Diálogo" name="type" value={formData.type} onChange={handleInputChange} required>
            {Object.values(DialogueType).map(type => (
            <option key={type} value={type}>{type}</option>
            ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fecha" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
            <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} required />
        </div>

        <Input label="Supervisor / Líder del Diálogo" name="supervisor" value={formData.supervisor} onChange={handleInputChange} required />
        <TextArea label="Participantes" name="participants" value={formData.participants} onChange={handleInputChange} rows={2} placeholder="Nombres de los participantes..."/>
        <TextArea label="Temas Tratados" name="topics" value={formData.topics} onChange={handleInputChange} rows={4} required placeholder="Resumen de los temas y puntos clave discutidos..."/>

        <FileUpload onFilesChange={handleFileChange} multiple />

        <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant="primary">Registrar Diálogo</Button>
        </div>
        </form>
    </div>
  );
};

export default DialogueForm;