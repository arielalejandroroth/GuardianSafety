import React, { useState } from 'react';
import { RiskEvaluation, RiskItem } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Select from './common/Select';
import FormSection from './common/FormSection';

interface EditEvaluationModalProps {
    evaluation: RiskEvaluation;
    onSave: (evaluation: RiskEvaluation) => void;
    onClose: () => void;
}

const EditEvaluationModal: React.FC<EditEvaluationModalProps> = ({ evaluation, onSave, onClose }) => {
    const [editedEvaluation, setEditedEvaluation] = useState(evaluation);

    const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedEvaluation(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRiskItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newRisks = [...editedEvaluation.risks];
        const riskItem = { ...newRisks[index] };
        
        // Handle number conversion
        const numericFields = ['item', 'valorFrecuencia', 'valorControl', 'valorConsecuencia', 'nivelRiesgoInicial', 'probOcurrenciaFinal', 'consecuenciaFinal', 'nivelRiesgoFinal'];
        if (numericFields.includes(name)) {
            (riskItem as any)[name] = Number(value);
        } else {
            (riskItem as any)[name] = value;
        }

        newRisks[index] = riskItem;
        setEditedEvaluation(prev => ({ ...prev, risks: newRisks }));
    };

    const handleSave = () => {
        onSave(editedEvaluation);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Editando Evaluación ${evaluation.id}`} size="4xl">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormSection title="Información General" initiallyOpen>
                    <Input label="Análisis Solicitado (Prompt)" name="prompt" value={editedEvaluation.prompt} onChange={handleGeneralChange} />
                </FormSection>

                {editedEvaluation.risks.map((risk, index) => (
                    <FormSection title={`Riesgo Identificado #${index + 1}: ${risk.riesgo}`} key={index}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Input label="Ítem" name="item" type="number" value={risk.item} onChange={e => handleRiskItemChange(index, e)} />
                            <Input label="Sector" name="sector" value={risk.sector} onChange={e => handleRiskItemChange(index, e)} />
                            <Input label="Área" name="area" value={risk.area} onChange={e => handleRiskItemChange(index, e)} />
                            <Input label="Puesto" name="puesto" value={risk.puesto} onChange={e => handleRiskItemChange(index, e)} />
                            <TextArea label="Tarea" name="tarea" value={risk.tarea} onChange={e => handleRiskItemChange(index, e)} rows={2} className="lg:col-span-2" />
                            <TextArea label="Peligros" name="peligros" value={risk.peligros} onChange={e => handleRiskItemChange(index, e)} rows={2} className="lg:col-span-2" />
                            <TextArea label="Riesgo" name="riesgo" value={risk.riesgo} onChange={e => handleRiskItemChange(index, e)} rows={2} className="lg:col-span-4" />
                        </div>
                        <div className="mt-4 pt-4 border-t">
                             <h4 className="font-semibold text-slate-700 mb-2">Evaluación Inicial</h4>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Input label="Frec. Exposición" name="frecuenciaExposicion" value={risk.frecuenciaExposicion} onChange={e => handleRiskItemChange(index, e)} />
                                <Input label="Control" name="control" value={risk.control} onChange={e => handleRiskItemChange(index, e)} />
                                <Input label="Consecuencia" name="consecuencia" value={risk.consecuencia} onChange={e => handleRiskItemChange(index, e)} />
                                <Input label="Clasificación" name="clasificacionRiesgoInicial" value={risk.clasificacionRiesgoInicial} onChange={e => handleRiskItemChange(index, e)} />
                             </div>
                        </div>
                         <div className="mt-4 pt-4 border-t">
                             <h4 className="font-semibold text-slate-700 mb-2">Acciones y Controles</h4>
                             <TextArea label="Acciones Requeridas" name="accionesRequeridas" value={risk.accionesRequeridas} onChange={e => handleRiskItemChange(index, e)} rows={3} />
                             <Input label="Procedimiento Asociado" name="procedimiento" value={risk.procedimiento} onChange={e => handleRiskItemChange(index, e)} />
                        </div>
                    </FormSection>
                ))}
            </div>
            <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </Modal>
    );
};

export default EditEvaluationModal;
