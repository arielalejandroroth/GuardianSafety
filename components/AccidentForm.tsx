

import React, { useState, useCallback } from 'react';
import { AccidentFormState, Attachment, ArtClassification, IncidentType, Gender, TaskType, Causal, EmployeeType } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import FileUpload from './common/FileUpload';
import Select from './common/Select';
import Card from './common/Card';
import FormSection from './common/FormSection';

interface AccidentFormProps {
  onSubmit: (data: AccidentFormState) => Promise<void>;
  onCancel: () => void;
}

const initialFormState: AccidentFormState = {
  planta: 'ROS',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().substring(0, 5),
  sector: '',
  area: '',
  lugar: '',
  puesto: '',
  employeeType: EmployeeType.PROPIO,
  contractorCompany: '',
  collaboratorName: '',
  legajo: '',
  fechaIngreso: '',
  genero: Gender.NO_ESPECIFICADO,
  supervisor: '',
  tipo: IncidentType.ACCIDENTE,
  description: '',
  clasificacionART: ArtClassification.INCIDENTE,
  tipoLesion: '',
  parteCuerpoAfectada: '',
  agenteMaterial: '',
  tareaRutinaria: TaskType.RUTINARIA,
  causal: Causal.CONDICION,
  utilizaEpp: '',
  costo: '',
  fechaAltaMedica: '',
  immediateActions: '',
  correctiveActions: [{ description: '', responsible: '', date: '' }],
  attachments: [],
};


const AccidentForm: React.FC<AccidentFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<AccidentFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCorrectiveActionChange = (index: number, field: string, value: string) => {
    const newActions = [...formData.correctiveActions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData(prev => ({ ...prev, correctiveActions: newActions }));
  };

  const addCorrectiveAction = () => {
    setFormData(prev => ({
      ...prev,
      correctiveActions: [...prev.correctiveActions, { description: '', responsible: '', date: '' }],
    }));
  };
  
  const removeCorrectiveAction = (index: number) => {
    setFormData(prev => ({
        ...prev,
        correctiveActions: prev.correctiveActions.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = useCallback((attachments: Attachment[]) => {
    setFormData(prev => ({ ...prev, attachments }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { 
        planta, date, time, sector, area, lugar, puesto, collaboratorName, legajo, supervisor,
        description, immediateActions, tipoLesion, parteCuerpoAfectada, agenteMaterial,
        fechaIngreso, employeeType, contractorCompany, utilizaEpp
    } = formData;

    const requiredFields: { [key: string]: string | undefined } = {
        'Planta': planta, 'Fecha': date, 'Hora': time, 'Sector': sector, 'Área': area, 'Lugar': lugar, 'Puesto de Trabajo': puesto,
        'Nombre Colaborador': collaboratorName, 'Legajo/DNI': legajo, 'Supervisor': supervisor, 'Descripción': description, 
        'Acciones Inmediatas': immediateActions, 'Utilizaba EPP': utilizaEpp
    };
    
    if (employeeType === EmployeeType.PROPIO) {
        requiredFields['Fecha de Ingreso'] = fechaIngreso;
    }
    
    if (employeeType === EmployeeType.CONTRATISTA) {
        requiredFields['Empresa Contratista'] = contractorCompany;
    }

    if (formData.clasificacionART !== ArtClassification.INCIDENTE) {
        requiredFields['Tipo de Lesión'] = tipoLesion;
        requiredFields['Parte del Cuerpo'] = parteCuerpoAfectada;
        requiredFields['Agente Material'] = agenteMaterial;
    }
    
    const emptyFields = Object.entries(requiredFields).filter(([_, value]) => !value || !value.trim());

    if(emptyFields.length > 0) {
        alert(`Por favor, complete todos los campos requeridos. Faltan: ${emptyFields.map(([key]) => key).join(', ')}`);
        return;
    }
    
    if (formData.correctiveActions.some(a => !a.description.trim() || !a.responsible.trim() || !a.date.trim())) {
        alert('Por favor, complete todos los campos para cada acción correctiva.');
        return;
    }

    setIsSubmitting(true);
    try {
        await onSubmit(formData);
    } catch (err) {
        console.error("Error submitting report:", err);
        alert("No se pudo guardar el informe. Por favor intente de nuevo.");
        setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Informe de Análisis de Accidentes / Incidentes</h2>

        <FormSection title="1. Datos del Suceso" initiallyOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Planta" name="planta" value={formData.planta} onChange={handleInputChange} />
            <Input label="Fecha del Incidente" name="date" type="date" value={formData.date} onChange={handleInputChange} />
            <Input label="Hora del Incidente" name="time" type="time" value={formData.time} onChange={handleInputChange} />
            <Input label="Turno" name="turno" value={formData.turno || ''} onChange={handleInputChange} placeholder="Ej: Mañana (M), Tarde (T), Noche (N)"/>
            <Input label="Sector" name="sector" value={formData.sector} onChange={handleInputChange} placeholder="Ej: Industrializado, Despostada"/>
            <Input label="Área / Proceso" name="area" value={formData.area} onChange={handleInputChange} placeholder="Ej: Hamburguesas, Trimming"/>
            <Input label="Lugar Específico" name="lugar" value={formData.lugar} onChange={handleInputChange} placeholder="Ej: Sierra N°2, Línea de empaque" />
          </div>
        </FormSection>
        
        <FormSection title="2. Datos del Afectado" initiallyOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select label="Tipo de Empleado" name="employeeType" value={formData.employeeType} onChange={handleInputChange}>
                    {Object.values(EmployeeType).map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
                {formData.employeeType === EmployeeType.CONTRATISTA && (
                    <Input label="Empresa Contratista" name="contractorCompany" value={formData.contractorCompany} onChange={handleInputChange} />
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <Input label="Nombre y Apellido" name="collaboratorName" value={formData.collaboratorName} onChange={handleInputChange} />
              <Input label="Legajo / DNI" name="legajo" value={formData.legajo} onChange={handleInputChange} placeholder="Ej: 58215"/>
              <Input label="Puesto de Trabajo" name="puesto" value={formData.puesto} onChange={handleInputChange} placeholder="Ej: Cuchillero, Operario"/>
              {formData.employeeType === EmployeeType.PROPIO && (
                 <Input label="Fecha de Ingreso" name="fechaIngreso" type="date" value={formData.fechaIngreso} onChange={handleInputChange} />
              )}
              <Select label="Género" name="genero" value={formData.genero} onChange={handleInputChange}>
                  {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
          </div>
        </FormSection>

        <FormSection title="3. Detalles y Clasificación del Incidente" initiallyOpen={true}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Supervisor a Cargo" name="supervisor" value={formData.supervisor} onChange={handleInputChange} />
               <Select label="Clasificación ART" name="clasificacionART" value={formData.clasificacionART} onChange={handleInputChange}>
                  {Object.values(ArtClassification).map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Tipo" name="tipo" value={formData.tipo} onChange={handleInputChange}>
                  {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
           </div>
           <TextArea label="Descripción de lo Sucedido" name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Describa detalladamente cómo ocurrió el incidente..." />
          {formData.clasificacionART !== ArtClassification.INCIDENTE && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200 mt-4">
                  <Input label="Tipo de Lesión" name="tipoLesion" value={formData.tipoLesion} onChange={handleInputChange} placeholder="Ej: Corte, Contusión, Quemadura"/>
                  <Input label="Parte del Cuerpo Afectada" name="parteCuerpoAfectada" value={formData.parteCuerpoAfectada} onChange={handleInputChange} placeholder="Ej: Mano izquierda, Dedo índice"/>
                  <Input label="Agente Material" name="agenteMaterial" value={formData.agenteMaterial} onChange={handleInputChange} placeholder="Ej: Cuchillo, Piso mojado, Escalera"/>
              </div>
          )}
        </FormSection>

        <FormSection title="4. Análisis de Causas y Acciones Inmediatas" initiallyOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="Tarea" name="tareaRutinaria" value={formData.tareaRutinaria} onChange={handleInputChange}>
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Select label="Causal Principal" name="causal" value={formData.causal} onChange={handleInputChange}>
                  {Object.values(Causal).map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Utilizaba EPP" name="utilizaEpp" value={formData.utilizaEpp} onChange={handleInputChange}>
                  <option value="">Seleccionar</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="N/A">N/A</option>
              </Select>
          </div>
          <TextArea label="Acciones Inmediatas Tomadas" name="immediateActions" value={formData.immediateActions} onChange={handleInputChange} rows={3} placeholder="Describa las acciones tomadas en el momento para controlar la situación..." />
          <FileUpload onFilesChange={handleFileChange} multiple />
        </FormSection>
        
        <FormSection title="5. Seguimiento y Costo" initiallyOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Fecha de Alta Médica" name="fechaAltaMedica" type="date" value={formData.fechaAltaMedica || ''} onChange={handleInputChange} />
              <Input label="Costo Estimado ($)" name="costo" type="number" value={formData.costo || ''} onChange={handleInputChange} placeholder="0"/>
          </div>
          <p className="text-xs text-slate-500 -mt-2">La Fecha de Alta Médica se usa para calcular los días de baja en casos CAF/CAFI.</p>
        </FormSection>
        
        <FormSection title="6. Acciones Correctivas (Se cargarán en la Matriz)" initiallyOpen={true}>
              {formData.correctiveActions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg relative space-y-2 bg-slate-50">
                      <p className="font-semibold text-slate-700">Acción Correctiva #{index + 1}</p>
                      {formData.correctiveActions.length > 1 && (
                           <button type="button" onClick={() => removeCorrectiveAction(index)} className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-xl px-2">
                               &times;
                           </button>
                      )}
                      <TextArea label={`Descripción`} name="description" value={action.description} onChange={(e) => handleCorrectiveActionChange(index, 'description', e.target.value)} rows={2} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input label="Responsable" name="responsible" value={action.responsible} onChange={(e) => handleCorrectiveActionChange(index, 'responsible', e.target.value)} />
                          <Input label="Fecha Planificada" name="date" type="date" value={action.date} onChange={(e) => handleCorrectiveActionChange(index, 'date', e.target.value)} />
                      </div>
                  </div>
              ))}
               <Button type="button" variant="secondary" onClick={addCorrectiveAction}>
                  + Añadir Otra Acción
              </Button>
        </FormSection>

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Registrar Incidente y Crear Acciones</Button>
        </div>
      </form>
    </Card>
  );
};

export default AccidentForm;