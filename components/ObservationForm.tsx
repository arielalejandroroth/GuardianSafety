import React, { useState, useCallback } from 'react';
import { ObservationFormState, RiskLevel, UnsafeActs, Attachment } from '../types';
import { EPP_OPTIONS, PROCEDURES_OPTIONS, PERSON_POSITION_OPTIONS, PERSON_REACTION_OPTIONS, TOOLS_OPTIONS } from '../constants';
import Button from './common/Button';
import Checkbox from './common/Checkbox';
import Input from './common/Input';
import TextArea from './common/TextArea';
import { suggestCorrection } from '../services/geminiService';
import { SparklesIcon } from './IconComponents';
import FileUpload from './common/FileUpload';

interface ObservationFormProps {
  onSubmit: (data: ObservationFormState) => void;
  onCancel: () => void;
  initialState?: ObservationFormState;
}

const initialFormState: ObservationFormState = {
  plant: 'ROS', // Default plant, not shown on form but needed for finding
  area: '', // Not shown, will be empty
  puesto: '', // Not shown, will be empty
  observedInfo: '',
  observationType: '',
  unsafeActs: { epp: [], procedures: [], personPosition: [], personReaction: [], tools: [] },
  riskPerception: '' as any, // Default to empty
  safeBehaviors: '',
  deviationObserved: '',
  immediateCorrection: '',
  observationResult: '',
  date: new Date().toISOString().split('T')[0],
  turn: '',
  sector: '', // Maps to "Sector Observado"
  responsibleSector: '', // Maps to "SECTOR RESPONSABLE"
  observerName: '',
  attachments: [],
};

const FormSectionHeader: React.FC<{ title: string, className?: string }> = ({ title, className }) => (
    <h3 className={`text-md font-semibold text-gray-800 bg-gray-200 p-2 rounded-md my-4 ${className}`}>
        {title}
    </h3>
);

const ObservationForm: React.FC<ObservationFormProps> = ({ onSubmit, onCancel, initialState = initialFormState }) => {
  const [formData, setFormData] = useState<ObservationFormState>(initialState);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'observationResult' && value === 'S/Desvío') {
        setFormData(prev => ({ 
            ...prev, 
            observationResult: value,
            unsafeActs: { epp: [], procedures: [], personPosition: [], personReaction: [], tools: [] },
            riskPerception: '' as any,
            deviationObserved: '',
            immediateCorrection: '',
            responsibleSector: '',
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (category: keyof UnsafeActs, value: string) => {
    setFormData(prev => {
      const currentValues = prev.unsafeActs[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return {
        ...prev,
        unsafeActs: {
          ...prev.unsafeActs,
          [category]: newValues,
        },
      };
    });
  };

  const handleSuggestCorrection = useCallback(async () => {
    setIsSuggesting(true);
    const suggestion = await suggestCorrection(formData.deviationObserved);
    setFormData(prev => ({ ...prev, immediateCorrection: suggestion }));
    setIsSuggesting(false);
  }, [formData.deviationObserved]);
  
  const handleFileChange = useCallback((attachments: Attachment[]) => {
      setFormData(prev => ({ ...prev, attachments }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const { date, turn, sector, observerName, responsibleSector, deviationObserved, immediateCorrection, observationResult, observedInfo, observationType, riskPerception } = formData;
    const validationErrors: string[] = [];

    if (!observedInfo || !observationType) {
        validationErrors.push('"Información del Observado" y "Tipo de Observación" son obligatorios.');
    }

    if (!date || !turn.trim() || !sector.trim() || !observerName.trim()) {
        validationErrors.push('Los campos de "Dados Complementarios de la Observación" son obligatorios.');
    }

    if (!observationResult) {
        validationErrors.push('Debe seleccionar el "Resultado de la Observación".');
    }

    if (observationResult === 'C/Desvío') {
        if (!deviationObserved.trim()) validationErrors.push('El campo "Desvío Observado" es obligatorio.');
        if (!immediateCorrection.trim()) validationErrors.push('El campo "Corrección Inmediata" es obligatorio.');
        if (!responsibleSector.trim()) validationErrors.push('El campo "Sector Responsable" es obligatorio.');
        if (!riskPerception) validationErrors.push('El campo "Percepción de los Riesgos" es obligatorio.');
    }

    if (validationErrors.length > 0) {
        alert('Por favor, corrija los siguientes errores:\n\n- ' + validationErrors.join('\n- '));
        return;
    }

    onSubmit(formData);
  }, [formData, onSubmit]);
  
  const riskOptions = [
      { label: 'Baja', value: RiskLevel.BAJO },
      { label: 'Regular', value: RiskLevel.MEDIO },
      { label: 'Alta', value: RiskLevel.ALTO },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-brand-dark text-center border-b pb-4 mb-6">OBSERVACION DE COMPORTAMIENTO</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        {/* Left Column */}
        <div className="border-r-0 md:border-r md:pr-8">
            <FormSectionHeader title="Información del Observado" />
            <div className="flex space-x-6">
                {[{label: 'Propio', value: 'Propio'}, {label: 'Tercero', value: 'Tercero'}].map(option => (
                    <label key={option.value} className="flex items-center">
                        <input type="radio" name="observedInfo" value={option.value} checked={formData.observedInfo === option.value} onChange={handleInputChange} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300" required/>
                        <span className="ml-2 text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>

            <FormSectionHeader title="Tipo de Observación" />
            <div className="flex space-x-6">
                {[{label: 'Programada', value: 'Programada'}, {label: 'Oportunidad', value: 'Oportunidad'}].map(option => (
                    <label key={option.value} className="flex items-center">
                        <input type="radio" name="observationType" value={option.value} checked={formData.observationType === option.value} onChange={handleInputChange} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300" required/>
                        <span className="ml-2 text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>

            <FormSectionHeader title="Marque con una 'X' si algún ítem es Inseguro" className="text-center" />
            <div className="space-y-4">
              <CheckboxGroup title="Elementos de Protección Personal - EPP's" options={EPP_OPTIONS} category="epp" formData={formData} onChange={handleCheckboxChange} />
              <CheckboxGroup title="Procedimientos y Reglas de Trabajo" options={PROCEDURES_OPTIONS} category="procedures" formData={formData} onChange={handleCheckboxChange} />
              <CheckboxGroup title="Posición de las Personas" options={PERSON_POSITION_OPTIONS} category="personPosition" formData={formData} onChange={handleCheckboxChange} />
              <CheckboxGroup title="Reacción de las Personas" options={PERSON_REACTION_OPTIONS} category="personReaction" formData={formData} onChange={handleCheckboxChange} />
              <CheckboxGroup title="Herramientas, Máquinas y Equipos" options={TOOLS_OPTIONS} category="tools" formData={formData} onChange={handleCheckboxChange} />
            </div>

            <FormSectionHeader title="VALORACION GENERAL DEL OBSERVADO" />
            <div>
                <label className="block text-sm font-medium text-gray-700">Percepción de los Riesgos</label>
                <div className="mt-2 flex space-x-4">
                    {riskOptions.map(option => (
                        <label key={option.value} className="flex items-center">
                            <input type="radio" name="riskPerception" value={option.value} checked={formData.riskPerception === option.value} onChange={handleInputChange} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300" disabled={formData.observationResult === 'S/Desvío'} />
                            <span className="ml-2 text-gray-700">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div>
          <FormSectionHeader title="Complete este Informe de Observación" />
          <TextArea label="Comportamientos Seguros Observados" name="safeBehaviors" value={formData.safeBehaviors} onChange={handleInputChange} rows={4} placeholder="Medidas para Incentivar la continuación del Comportamiento Seguro"/>

          {formData.observationResult === 'C/Desvío' && (
            <div className="space-y-4 mt-4">
                <TextArea label="Desvío Observado" name="deviationObserved" value={formData.deviationObserved} onChange={handleInputChange} rows={4} placeholder="Describa detalladamente el acto o condición insegura..." required />
                <div>
                  <TextArea label="Corrección Inmediata" name="immediateCorrection" value={formData.immediateCorrection} onChange={handleInputChange} rows={4} placeholder="Describa la acción tomada para corregir el desvío..." required />
                  <Button type="button" variant="warning" onClick={handleSuggestCorrection} isLoading={isSuggesting} disabled={!formData.deviationObserved || isSuggesting} className="mt-2">
                      <SparklesIcon className="h-5 w-5 mr-2"/>
                      Sugerir Corrección (IA)
                  </Button>
                </div>
            </div>
          )}

          <FormSectionHeader title="Dados Complementarios de la Observación" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultado de la Observación <span className="text-red-500">*</span></label>
              <div className="flex space-x-4 bg-gray-100 p-2 rounded-md">
                  {[{label: 'C/ Desvío', value: 'C/Desvío'}, {label: 'S/ Desvío', value: 'S/Desvío'}].map(option => (
                      <label key={option.value} className="flex items-center">
                          <input type="radio" name="observationResult" value={option.value} checked={formData.observationResult === option.value} onChange={handleInputChange} className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300" required/>
                          <span className="ml-2 text-gray-700 font-semibold">{option.label}</span>
                      </label>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha" type="date" name="date" value={formData.date} onChange={handleInputChange} required/>
                <Input label="Turno" name="turn" value={formData.turn} onChange={handleInputChange} placeholder="Mañana, Tarde..." required/>
            </div>
            <Input label="Sector Observado" name="sector" value={formData.sector} onChange={handleInputChange} placeholder="Ej: Producción, Almacén" required/>
            {formData.observationResult === 'C/Desvío' &&
                <Input label="SECTOR RESPONSABLE" name="responsibleSector" value={formData.responsibleSector} onChange={handleInputChange} placeholder="Ej: Mantenimiento" required/>
            }
            <Input label="Nombre del Observador" name="observerName" value={formData.observerName} onChange={handleInputChange} required/>
             <FileUpload onFilesChange={handleFileChange} multiple />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">Enviar Observación</Button>
      </div>
    </form>
  );
};

interface CheckboxGroupProps {
  title: string;
  options: string[];
  category: keyof UnsafeActs;
  formData: ObservationFormState;
  onChange: (category: keyof UnsafeActs, value: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ title, options, category, formData, onChange }) => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(option => (
        <Checkbox
          key={option}
          label={option}
          checked={formData.unsafeActs[category].includes(option)}
          onChange={() => onChange(category, option)}
          disabled={formData.observationResult === 'S/Desvío'}
        />
      ))}
    </div>
  </div>
);

export default ObservationForm;