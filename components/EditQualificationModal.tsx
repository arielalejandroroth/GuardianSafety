import React, { useState, useCallback } from 'react';
import { Qualification, Equipment, Attachment, MedicalStatus } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import TextArea from './common/TextArea';
import FileUpload from './common/FileUpload';

interface EditQualificationModalProps {
  qualification: Qualification;
  onClose: () => void;
  onSave: (qualification: Qualification) => void;
}

const EditQualificationModal: React.FC<EditQualificationModalProps> = ({ qualification, onClose, onSave }) => {
  const [editedQualification, setEditedQualification] = useState<Qualification>(qualification);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedQualification(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = useCallback((files: Attachment[]) => {
      setEditedQualification(prev => ({ ...prev, personnelPhoto: files[0] }));
  }, []);
  
  const handleAttachmentsChange = useCallback((attachments: Attachment[]) => {
      setEditedQualification(prev => ({ ...prev, attachments }));
  }, []);

  const handleSave = () => {
    // Basic validation
    if (!editedQualification.personnelName || !editedQualification.personnelId) {
        alert('Nombre y Legajo son campos obligatorios.');
        return;
    }
    onSave(editedQualification);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar Habilitación: ${qualification.personnelName}`}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <Input label="Nombre y Apellido del Personal" name="personnelName" value={editedQualification.personnelName} onChange={handleChange} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Legajo" name="personnelId" value={editedQualification.personnelId} onChange={handleChange} required />
          <Input label="Sector" name="sector" value={editedQualification.sector} onChange={handleChange} required />
        </div>
        <Input label="Supervisor a Cargo" name="supervisor" value={editedQualification.supervisor} onChange={handleChange} required />

        <Select label="Equipo Habilitado" name="equipment" value={editedQualification.equipment} onChange={handleChange} required>
            {Object.values(Equipment).map(e => (
                <option key={e} value={e}>{e}</option>
            ))}
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fecha de Capacitación" name="issueDate" type="date" value={editedQualification.issueDate} onChange={handleChange} required />
            <Input label="Vencimiento Habilitación" name="expiryDate" type="date" value={editedQualification.expiryDate} onChange={handleChange} required />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vencimiento Psicofísico" name="psychophysicalExpiryDate" type="date" value={editedQualification.psychophysicalExpiryDate} onChange={handleChange} required />
             <Select label="Apto Médico" name="medicalCheckupStatus" value={editedQualification.medicalCheckupStatus} onChange={handleChange} required>
                {Object.values(MedicalStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </Select>
        </div>
        
        <Input label="Instructor / Entidad Certificadora" name="instructor" value={editedQualification.instructor} onChange={handleChange} required />
        
        <TextArea label="Observaciones" name="observations" value={editedQualification.observations} onChange={handleChange} rows={3} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Personal</label>
           {editedQualification.personnelPhoto && (
            <div className="mb-2">
              <p className="text-sm text-gray-500">Foto Actual:</p>
              <img src={`data:${editedQualification.personnelPhoto.type};base64,${editedQualification.personnelPhoto.data}`} alt="Foto actual" className="h-24 w-24 rounded-lg object-cover" />
            </div>
          )}
          <FileUpload onFilesChange={handlePhotoChange} multiple={false} />
           <p className="text-xs text-gray-500 mt-1">Subir una nueva foto reemplazará la actual.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Certificados</label>
          <FileUpload onFilesChange={handleAttachmentsChange} multiple />
        </div>

      </div>
      <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
      </div>
    </Modal>
  );
};

export default EditQualificationModal;