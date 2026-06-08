import React, { useState } from 'react';
import { AccidentReport, ArtClassification, IncidentType, Gender, TaskType, Causal, EmployeeType } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Select from './common/Select';
import FormSection from './common/FormSection';

interface EditAccidentModalProps {
  accident: AccidentReport;
  onClose: () => void;
  onSave: (accident: AccidentReport) => void;
}

const EditAccidentModal: React.FC<EditAccidentModalProps> = ({ accident, onClose, onSave }) => {
  const [editedAccident, setEditedAccident] = useState<AccidentReport>(accident);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedAccident(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(editedAccident);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar Incidente: ${accident.id}`} size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormSection title="Datos del Suceso" initiallyOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Planta" name="planta" value={editedAccident.planta} onChange={handleChange} />
                <Input label="Fecha del Incidente" name="date" type="date" value={editedAccident.date} onChange={handleChange} />
                <Input label="Hora del Incidente" name="time" type="time" value={editedAccident.time} onChange={handleChange} />
                <Input label="Sector" name="sector" value={editedAccident.sector} onChange={handleChange} />
                <Input label="Área / Proceso" name="area" value={editedAccident.area} onChange={handleChange} />
                <Input label="Lugar Específico" name="lugar" value={editedAccident.lugar} onChange={handleChange} />
            </div>
        </FormSection>

        <FormSection title="Datos del Afectado" initiallyOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Select label="Tipo de Empleado" name="employeeType" value={editedAccident.employeeType} onChange={handleChange}>
                    {Object.values(EmployeeType).map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
                {editedAccident.employeeType === EmployeeType.CONTRATISTA && (
                    <Input label="Empresa Contratista" name="contractorCompany" value={editedAccident.contractorCompany} onChange={handleChange} />
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <Input label="Nombre y Apellido" name="collaboratorName" value={editedAccident.collaboratorName} onChange={handleChange} />
                <Input label="Legajo / DNI" name="legajo" value={editedAccident.legajo} onChange={handleChange} />
                <Input label="Puesto de Trabajo" name="puesto" value={editedAccident.puesto} onChange={handleChange} />
                {editedAccident.employeeType === EmployeeType.PROPIO && (
                    <Input label="Fecha de Ingreso" name="fechaIngreso" type="date" value={editedAccident.fechaIngreso} onChange={handleChange} />
                )}
                <Select label="Género" name="genero" value={editedAccident.genero} onChange={handleChange}>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
            </div>
        </FormSection>

        <FormSection title="Detalles y Clasificación" initiallyOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Supervisor a Cargo" name="supervisor" value={editedAccident.supervisor} onChange={handleChange} />
                <Select label="Clasificación ART" name="clasificacionART" value={editedAccident.clasificacionART} onChange={handleChange}>
                    {Object.values(ArtClassification).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Select label="Tipo" name="tipo" value={editedAccident.tipo} onChange={handleChange}>
                    {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>
            <TextArea label="Descripción de lo Sucedido" name="description" value={editedAccident.description} onChange={handleChange} rows={3} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t">
                <Input label="Tipo de Lesión" name="tipoLesion" value={editedAccident.tipoLesion} onChange={handleChange} />
                <Input label="Parte del Cuerpo Afectada" name="parteCuerpoAfectada" value={editedAccident.parteCuerpoAfectada} onChange={handleChange} />
                <Input label="Agente Material" name="agenteMaterial" value={editedAccident.agenteMaterial} onChange={handleChange} />
            </div>
        </FormSection>

        <FormSection title="Análisis y Seguimiento" initiallyOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Tarea" name="tareaRutinaria" value={editedAccident.tareaRutinaria} onChange={handleChange}>
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Select label="Causal Principal" name="causal" value={editedAccident.causal} onChange={handleChange}>
                    {Object.values(Causal).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
            </div>
             <TextArea label="Acciones Correctivas (resumen)" name="correctiveActions" value={editedAccident.correctiveActions} onChange={handleChange} rows={2} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t">
                 <Input label="Fecha de Alta Médica" name="fechaAltaMedica" type="date" value={editedAccident.fechaAltaMedica || ''} onChange={handleChange} />
                 <Input label="Costo Estimado ($)" name="costo" type="number" value={editedAccident.costo || ''} onChange={handleChange} />
             </div>
        </FormSection>

      </div>
      <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
      </div>
    </Modal>
  );
};

export default EditAccidentModal;