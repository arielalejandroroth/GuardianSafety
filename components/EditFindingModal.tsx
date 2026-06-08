import React, { useState, useCallback } from 'react';
import { Finding, FindingStatus, RiskLevel, Attachment } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Select from './common/Select';
import FileUpload from './common/FileUpload';

interface EditFindingModalProps {
  finding: Finding;
  onClose: () => void;
  onSave: (finding: Finding) => void;
}

const EditFindingModal: React.FC<EditFindingModalProps> = ({ finding, onClose, onSave }) => {
  const [editedFinding, setEditedFinding] = useState<Finding>(finding);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedFinding(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentsChange = useCallback((attachments: Attachment[]) => {
      setEditedFinding(prev => ({ ...prev, attachments }));
  }, []);

  const handleSave = () => {
    onSave(editedFinding);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar Hallazgo: ${finding.id}`}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <div>
          <h4 className="font-semibold">Desvío:</h4>
          <p className="text-gray-700 bg-gray-100 p-2 rounded">{finding.deviation}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Estado" name="status" value={editedFinding.status} onChange={handleChange}>
                <option value={FindingStatus.ABIERTO}>Abierto</option>
                <option value={FindingStatus.EN_EJECUCION}>En Ejecución</option>
                <option value={FindingStatus.CUMPLIDO}>Cumplido</option>
            </Select>
            <Select label="Nivel de Riesgo" name="riskLevel" value={editedFinding.riskLevel} onChange={handleChange}>
                <option value={RiskLevel.BAJO}>Bajo</option>
                <option value={RiskLevel.MEDIO}>Medio</option>
                <option value={RiskLevel.ALTO}>Alto</option>
            </Select>
        </div>

        <TextArea 
            label="Acción Correctiva / Preventiva"
            name="correctiveAction"
            value={editedFinding.correctiveAction}
            onChange={handleChange}
            rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                label="Responsable de Sector"
                name="sectorResponsible"
                value={editedFinding.sectorResponsible}
                onChange={handleChange}
            />
            <Input
                label="Responsable de Acción"
                name="actionResponsible"
                value={editedFinding.actionResponsible}
                onChange={handleChange}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
                label="Fecha Planificada"
                name="plannedDate"
                type="date"
                value={editedFinding.plannedDate || ''}
                onChange={handleChange}
            />
             <Input
                label="Fecha Realizada"
                name="realizedDate"
                type="date"
                value={editedFinding.realizedDate || ''}
                onChange={handleChange}
            />
        </div>

        <TextArea 
            label="Observaciones de Seguimiento"
            name="observations"
            value={editedFinding.observations}
            onChange={handleChange}
            rows={3}
        />
        
        <FileUpload 
            onFilesChange={handleAttachmentsChange}
            initialAttachments={editedFinding.attachments}
            multiple
        />

        </div>
        <div className="flex justify-end space-x-4 pt-4 mt-4 border-t">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
        </div>
    </Modal>
  );
};

export default EditFindingModal;