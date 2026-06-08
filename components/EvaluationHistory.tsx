import React, { useState } from 'react';
import { RiskEvaluation, View, SafeWorkProcedure } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import { AiVisionIcon, EyeIcon, DocumentTextIcon } from './IconComponents';
import EvaluationReportModal from './EvaluationReportModal';
import { generateSafeWorkProcedure } from '../services/geminiService';
import ProcedureViewModal from './ProcedureViewModal';
import { supabase } from '../services/supabaseClient';

interface EvaluationHistoryProps {
    evaluations: RiskEvaluation[];
    onUpdate: (evaluation: RiskEvaluation) => void;
    onNavigate: (view: View) => void;
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ evaluations, onUpdate, onNavigate }) => {
    const [selectedEvaluation, setSelectedEvaluation] = useState<RiskEvaluation | null>(null);
    const [generatingPtsId, setGeneratingPtsId] = useState<string | null>(null);
    const [viewingProcedureFor, setViewingProcedureFor] = useState<RiskEvaluation | null>(null);

    const sortedEvaluations = [...evaluations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleGenerateOrViewPts = async (evaluation: RiskEvaluation) => {
        if (evaluation.procedure) {
            setViewingProcedureFor(evaluation);
        } else {
            setGeneratingPtsId(evaluation.id);
            try {
                // Calculate next procedure code
                const allProcedureCodes = evaluations
                    .map(e => e.procedure?.codigo)
                    .filter((c): c is string => !!c);

                let nextProcedureNumber = 38; // Default starting point as requested
                if (allProcedureCodes.length > 0) {
                    const procedureNumbers = allProcedureCodes.map(code => {
                        const match = code.match(/P-HS-(\d+)-AR/);
                        return match ? parseInt(match[1], 10) : 0;
                    });
                    const maxNumber = Math.max(...procedureNumbers);
                    if (maxNumber > 0) {
                        nextProcedureNumber = maxNumber + 1;
                    }
                }
                const nextProcedureCode = `P-HS-${String(nextProcedureNumber).padStart(2, '0')}-AR`;

                const procedure = await generateSafeWorkProcedure(evaluation, nextProcedureCode);
                const updatedEvaluation = { ...evaluation, procedure };
                onUpdate(updatedEvaluation); // This will call the async handler in App.tsx
                setViewingProcedureFor(updatedEvaluation);
            } catch (error) {
                alert(error instanceof Error ? error.message : "Ocurrió un error al generar el PTS.");
            } finally {
                setGeneratingPtsId(null);
            }
        }
    };
    
    const handleProcedureSave = (updatedEvaluation: RiskEvaluation) => {
        onUpdate(updatedEvaluation);
        setViewingProcedureFor(updatedEvaluation); // Keep modal open with updated data
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h2 className="text-2xl font-bold text-slate-800">Historial de Evaluaciones de Riesgo</h2>
                <Button variant="primary" onClick={() => onNavigate(View.SEGURITO_VISION)}>
                    <AiVisionIcon className="h-5 w-5 mr-2" />
                    Nueva Evaluación
                </Button>
            </div>

            {sortedEvaluations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <p>No hay evaluaciones guardadas en el historial.</p>
                    <p>Realice un nuevo análisis para comenzar.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Análisis Solicitado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">N° Riesgos</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Informe IPERC</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PTS Generados</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {sortedEvaluations.map(evaluation => (
                                <tr key={evaluation.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{evaluation.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(evaluation.date).toLocaleDateString('es-AR')}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 max-w-sm truncate" title={evaluation.prompt}>{evaluation.prompt}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{evaluation.risks.length}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button onClick={() => setSelectedEvaluation(evaluation)} size="sm">
                                            <EyeIcon className="w-4 h-4 mr-2"/>
                                            Ver Informe
                                        </Button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button 
                                          size="sm"
                                          onClick={() => handleGenerateOrViewPts(evaluation)}
                                          isLoading={generatingPtsId === evaluation.id}
                                          variant={evaluation.procedure ? 'secondary' : 'primary'}
                                        >
                                          {generatingPtsId !== evaluation.id && <DocumentTextIcon className="w-4 h-4 mr-2"/>}
                                          {evaluation.procedure ? 'Ver/Editar PTS' : 'Generar PTS'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {selectedEvaluation && (
                <EvaluationReportModal 
                    evaluation={selectedEvaluation}
                    onUpdate={onUpdate}
                    onClose={() => setSelectedEvaluation(null)}
                />
            )}

            {viewingProcedureFor && (
                <ProcedureViewModal
                    evaluation={viewingProcedureFor}
                    onClose={() => setViewingProcedureFor(null)}
                    onSave={handleProcedureSave}
                />
            )}
        </Card>
    );
};

export default EvaluationHistory;