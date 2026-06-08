import React, { useState, useCallback, useEffect } from 'react';
import { Qualification, Equipment, Attachment, MedicalStatus } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import FileUpload from './common/FileUpload';
import TextArea from './common/TextArea';

interface QualificationFormProps {
  onSubmit: (data: Omit<Qualification, 'id'>) => void;
  onCancel: () => void;
}

const initialFormState: Omit<Qualification, 'id'> = {
  personnelName: '',
  personnelId: '',
  supervisor: '',
  sector: '',
  equipment: Object.values(Equipment)[0],
  issueDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  psychophysicalExpiryDate: '',
  medicalCheckupStatus: MedicalStatus.APTO,
  observations: '',
  instructor: '',
  attachments: [],
  personnelPhoto: undefined,
};


const QualificationForm: React.FC<QualificationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (formData.issueDate) {
      const issue = new Date(formData.issueDate);
      issue.setFullYear(issue.getFullYear() + 2);
      const timezoneOffset = issue.getTimezoneOffset() * 60000;
      const correctedDate = new Date(issue.getTime() - timezoneOffset);
      const newExpiryDate = correctedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, expiryDate: newExpiryDate }));
    }
  }, [formData.issueDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentsChange = useCallback((attachments: Attachment[]) => {
      setFormData(prev => ({ ...prev, attachments }));
  }, []);
  
  const handlePhotoChange = useCallback((files: Attachment[]) => {
      setFormData(prev => ({ ...prev, personnelPhoto: files[0] }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const { personnelName, personnelId, expiryDate, instructor, sector, supervisor, psychophysicalExpiryDate } = formData;
    if (!personnelName.trim() || !personnelId.trim() || !expiryDate.trim() || !instructor.trim() || !sector.trim() || !supervisor.trim() || !psychophysicalExpiryDate.trim()) {
        alert('Por favor, complete todos los campos obligatorios.');
        return;
    }

    onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-brand-dark">Registrar Nueva Habilitación</h2>
            
            <div className="space-y-4">
                <Input label="Nombre y Apellido del Personal" name="personnelName" value={formData.personnelName} onChange={handleInputChange} required placeholder="Ej: GOMEZ, ELIAS EMANUEL"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Legajo" name="personnelId" value={formData.personnelId} onChange={handleInputChange} required placeholder="Ej: 58215"/>
                  <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} required placeholder="Ej: Mantenimiento"/>
                </div>
                <Input label="Supervisor a Cargo" name="supervisor" value={formData.supervisor} onChange={handleInputChange} required placeholder="Ej: Juan Perez"/>

                <Select label="Equipo Habilitado" name="equipment" value={formData.equipment} onChange={handleInputChange} required>
                    {Object.values(Equipment).map(e => (
                        <option key={e} value={e}>{e}</option>
                    ))}
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Fecha de Capacitación" name="issueDate" type="date" value={formData.issueDate} onChange={handleInputChange} required />
                    <Input label="Vencimiento Habilitación (2 años)" name="expiryDate" type="date" value={formData.expiryDate} readOnly />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Vencimiento Psicofísico" name="psychophysicalExpiryDate" type="date" value={formData.psychophysicalExpiryDate} onChange={handleInputChange} required />
                     <Select label="Apto Médico" name="medicalCheckupStatus" value={formData.medicalCheckupStatus} onChange={handleInputChange} required>
                        {Object.values(MedicalStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Select>
                </div>
                
                <Input label="Instructor / Entidad Certificadora" name="instructor" value={formData.instructor} onChange={handleInputChange} required />
                
                <TextArea label="Observaciones" name="observations" value={formData.observations} onChange={handleInputChange} rows={3} placeholder="Añadir observaciones relevantes..."/>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Personal (Opcional)</label>
                  <FileUpload onFilesChange={handlePhotoChange} multiple={false} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Certificados (Opcional)</label>
                  <FileUpload onFilesChange={handleAttachmentsChange} multiple />
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Habilitación</Button>
            </div>
        </form>
    </div>
  );
};

export default QualificationForm;