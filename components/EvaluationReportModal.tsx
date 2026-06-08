import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { RiskEvaluation } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import { DownloadIcon, PencilIcon, DocumentTextIcon } from './IconComponents';
import RiskAssessmentTable from './RiskAssessmentTable';
import EditEvaluationModal from './EditEvaluationModal';
import { getCorporateHeaderHtml } from '../utils/corporateHeader';

interface EvaluationReportModalProps {
    evaluation: RiskEvaluation;
    onClose: () => void;
    onUpdate: (updatedEvaluation: RiskEvaluation) => void;
}

const RiskSummaryPill: React.FC<{ label: string; count: number; }> = ({ label, count }) => {
    const getColorClass = (label: string) => {
        const lowerLabel = (label || '').toLowerCase();
        if (lowerLabel.includes('alto')) return 'bg-red-100 text-red-800';
        if (lowerLabel.includes('medio')) return 'bg-yellow-100 text-yellow-800';
        if (lowerLabel.includes('bajo')) return 'bg-green-100 text-green-800';
        return 'bg-slate-100 text-slate-800';
    };

    if (!count || count === 0) return null;

    return (
        <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${getColorClass(label)}`}>
            {label}
            <span className="bg-white/75 rounded-full px-2 text-xs">{count}</span>
        </div>
    );
};

const EvaluationReportModal: React.FC<EvaluationReportModalProps> = ({ evaluation, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const isVideo = evaluation.media.type.startsWith('video/');

    const riskSummary = useMemo(() => {
        if (!evaluation || !evaluation.risks) {
            return { initial: {}, final: {} };
        }

        const initialCounts = evaluation.risks.reduce((acc, risk) => {
            const classification = risk.clasificacionRiesgoInicial || 'Indeterminado';
            acc[classification] = (acc[classification] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const finalCounts = evaluation.risks.reduce((acc, risk) => {
            const classification = risk.clasificacionRiesgoFinal || 'Indeterminado';
            acc[classification] = (acc[classification] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { initial: initialCounts, final: finalCounts };
    }, [evaluation]);


    const handleExportExcel = () => {
        const dataToExport = evaluation.risks.map(risk => ({
            'Ítem': risk.item,
            'Sector': risk.sector,
            'Área': risk.area,
            'Puesto': risk.puesto,
            'Tarea': risk.tarea,
            'Rutinaria (R/N)': risk.rutinaria,
            'Peligros': risk.peligros,
            'Riesgo': risk.riesgo,
            'Frec. Exposición': risk.frecuenciaExposicion,
            'Control': risk.control,
            'Consecuencia': risk.consecuencia,
            'Nivel Riesgo Inicial': risk.nivelRiesgoInicial,
            'Clasificación Inicial': risk.clasificacionRiesgoInicial,
            'Detalle Controles': risk.detalleControles,
            'Prob. Ocurrencia Final': risk.probOcurrenciaFinal,
            'Consecuencia Final': risk.consecuenciaFinal,
            'Nivel Riesgo Final': risk.nivelRiesgoFinal,
            'Clasificación Final': risk.clasificacionRiesgoFinal,
            'Acciones Requeridas': risk.accionesRequeridas,
            'Procedimiento': risk.procedimiento,
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Evaluacion de Riesgo");
        XLSX.writeFile(wb, `Evaluacion_Riesgo_${evaluation.id}.xlsx`);
    };
    
    const handleExportToWord = () => {
        const getRiskHexColors = (classification: string) => {
            if (!classification) return { bg: '#F1F5F9', text: '#1E293B' };
            const lowerClass = classification.toLowerCase();
            if (lowerClass.includes('alto') || lowerClass.includes('crítico')) return { bg: '#FEE2E2', text: '#991B1B' };
            if (lowerClass.includes('medio')) return { bg: '#FEF9C3', text: '#854D0E' };
            if (lowerClass.includes('bajo')) return { bg: '#DCFCE7', text: '#166534' };
            return { bg: '#F1F5F9', text: '#1E293B' };
        };

        const evidenceHtml = !isVideo ? `
            <h2>2. Evidencia Visual</h2>
            <div style="padding: 10px; border: 1px solid #E2E8F0; margin-top: 10px; margin-bottom: 20px; page-break-inside: avoid; text-align: center;">
                <img src="data:${evaluation.media.type};base64,${evaluation.media.data}" style="max-width: 450pt; width: 25%; height: auto; display: inline-block;" />
            </div>` : '';
        
        const tableHeaderHtml = `
            <thead>
                <tr>
                    <th colspan="8" style="text-align: center; background-color: #DBEAFE;">Identificación</th>
                    <th colspan="7" style="text-align: center; background-color: #FFEDD5;">Evaluación Inicial</th>
                    <th colspan="6" style="text-align: center; background-color: #E0E7FF;">Controles</th>
                    <th colspan="4" style="text-align: center; background-color: #D1FAE5;">Evaluación Final</th>
                    <th colspan="2" style="text-align: center; background-color: #EDE9FE;">Plan de Acción</th>
                </tr>
                <tr style="background-color: #F1F5F9; font-weight: bold;">
                    <th style="width: 1%;">Ítem</th>
                    <th style="width: 4%;">Sector</th>
                    <th style="width: 4%;">Área</th>
                    <th style="width: 5%;">Puesto</th>
                    <th style="width: 8%;">Tarea</th>
                    <th style="width: 1%;">R/N</th>
                    <th style="width: 9%;">Peligros</th>
                    <th style="width: 8%;">Riesgo</th>
                    
                    <th style="width: 3%;">Frec. Exp.</th>
                    <th style="width: 3%;">Control</th>
                    <th style="width: 3%;">Consec.</th>
                    <th style="width: 1%;">F</th>
                    <th style="width: 1%;">C</th>
                    <th style="width: 1%;">Ctr</th>
                    <th style="width: 3%;">NR Inicial</th>
                    
                    <th style="width: 1%;">E</th>
                    <th style="width: 1%;">S</th>
                    <th style="width: 1%;">CI</th>
                    <th style="width: 1%;">SAC</th>
                    <th style="width: 1%;">EPP</th>
                    <th style="width: 13%;">Detalle</th>
                    
                    <th style="width: 1%;">Prob.</th>
                    <th style="width: 1%;">Consec.</th>
                    <th style="width: 2%;">NR Final</th>
                    <th style="width: 4%;">Clasif. Final</th>
                    
                    <th style="width: 13%;">Acciones Req.</th>
                    <th style="width: 6%;">Procedimiento</th>
                </tr>
            </thead>`;

        const tableBodyHtml = evaluation.risks.map(risk => {
            const initialRiskColors = getRiskHexColors(risk.clasificacionRiesgoInicial);
            const finalRiskColors = getRiskHexColors(risk.clasificacionRiesgoFinal);
            return `
                <tr>
                    <td>${risk.item || ''}</td>
                    <td>${risk.sector || ''}</td>
                    <td>${risk.area || ''}</td>
                    <td>${risk.puesto || ''}</td>
                    <td>${risk.tarea || ''}</td>
                    <td style="text-align: center;">${risk.rutinaria || ''}</td>
                    <td>${risk.peligros || ''}</td>
                    <td>${risk.riesgo || ''}</td>
                    <td>${risk.frecuenciaExposicion || ''}</td>
                    <td>${risk.control || ''}</td>
                    <td>${risk.consecuencia || ''}</td>
                    <td style="text-align: center;">${risk.valorFrecuencia || ''}</td>
                    <td style="text-align: center;">${risk.valorConsecuencia || ''}</td>
                    <td style="text-align: center;">${risk.valorControl || ''}</td>
                    <td style="text-align: center; font-weight: bold; background-color: ${initialRiskColors.bg}; color: ${initialRiskColors.text};">${risk.nivelRiesgoInicial || ''}</td>
                    <td style="text-align: center;">${risk.eliminacion || ''}</td>
                    <td style="text-align: center;">${risk.sustitucion || ''}</td>
                    <td style="text-align: center;">${risk.controlesIngenieria || ''}</td>
                    <td style="text-align: center;">${risk.sac || ''}</td>
                    <td style="text-align: center;">${risk.epp || ''}</td>
                    <td>${risk.detalleControles || ''}</td>
                    <td style="text-align: center;">${risk.probOcurrenciaFinal || ''}</td>
                    <td style="text-align: center;">${risk.consecuenciaFinal || ''}</td>
                    <td style="text-align: center; font-weight: bold; background-color: ${finalRiskColors.bg}; color: ${finalRiskColors.text};">${risk.nivelRiesgoFinal || ''}</td>
                    <td style="font-weight: bold;">${risk.clasificacionRiesgoFinal || ''}</td>
                    <td>${risk.accionesRequeridas || ''}</td>
                    <td>${risk.procedimiento || ''}</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Informe de Evaluación de Riesgos</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Arial, sans-serif; font-size: 10pt; }
                    h1 { font-family: 'Calibri', sans-serif; }
                    h2 { font-family: 'Calibri', sans-serif; color: #00529B; font-size: 14pt; font-weight: bold; border-bottom: 1px solid #dee2e6; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }
                    table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 5pt; }
                    th, td { border: 1px solid #A0A0A0; padding: 2px; word-wrap: break-word; vertical-align: top; }
                    th { background-color: #F1F5F9; font-weight: bold; text-align: center; }
                    
                    @page Section1 {
                        size: 595.3pt 841.9pt; /* A4 Portrait */
                        margin: 1cm;
                        mso-header-margin:.5in;
                        mso-footer-margin:.5in;
                        mso-paper-source:0;
                    }
                    div.Section1 {
                        page:Section1;
                    }

                    @page Section2 {
                        size: 841.9pt 595.3pt; /* A4 Landscape */
                        margin: 1cm;
                        mso-header-margin:.5in;
                        mso-footer-margin:.5in;
                        mso-paper-source:0;
                    }
                    div.Section2 {
                        page:Section2;
                    }
                </style>
            </head>
            <body>
                <div class="Section1">
                     ${getCorporateHeaderHtml()}
                     <table style="width: 100%; border: none; margin-bottom: 20px;">
                        <tr>
                            <td style="border: none; text-align: center;">
                                <h1 style="margin: 0; color: #00529B; font-size: 18pt;">Informe de Evaluación de Riesgos (IPERC)</h1>
                                <p style="font-size: 14px; margin: 0;">Departamento de Higiene y Seguridad</p>
                            </td>
                            <td style="border: none; width: 150px; text-align: right; vertical-align: top;">
                                <p style="font-size: 9pt; color: #6B7280; margin: 0;">ID: ${evaluation.id}</p>
                            </td>
                        </tr>
                    </table>
                    
                    <h2>1. Detalles de la Evaluación</h2>
                    <table style="width: 100%; font-size: 10pt; margin-bottom: 20px; border: 1px solid #A0A0A0;">
                        <tr>
                            <td style="background-color: #F1F5F9; font-weight: bold; width: 25%;">Fecha de Evaluación</td>
                            <td>${new Date(evaluation.date).toLocaleString('es-AR')}</td>
                        </tr>
                         <tr>
                            <td style="background-color: #F1F5F9; font-weight: bold;">Análisis Solicitado</td>
                            <td><i>"${evaluation.prompt}"</i></td>
                        </tr>
                    </table>

                    ${evidenceHtml}
                </div>

                <br clear=all style='mso-special-character:line-break;page-break-before:always'>
                
                <div class="Section2">
                    <h2>${isVideo ? '2.' : '3.'} Matriz de Riesgos Identificados</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                       ${tableHeaderHtml}
                       <tbody>${tableBodyHtml}</tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Informe_Riesgo_${evaluation.id}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const handleSaveEdit = (updatedEvaluation: RiskEvaluation) => {
        onUpdate(updatedEvaluation);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <EditEvaluationModal
                evaluation={evaluation}
                onSave={handleSaveEdit}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={`Informe de Evaluación #${evaluation.id.split('-')[1]}`} size="4xl">
            <div className="space-y-4">
                <div className="flex justify-end gap-2 no-print">
                    <Button onClick={() => {}} variant="secondary" size="sm" disabled title="Genere o vea el PTS desde la pantalla de Historial">
                        <DocumentTextIcon className="w-4 h-4 mr-2"/> {evaluation.procedure ? 'Ver Procedimiento' : 'Generar Procedimiento'}
                    </Button>
                    <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
                        <PencilIcon className="w-4 h-4 mr-2"/> Editar
                    </Button>
                    <Button onClick={handleExportExcel} variant="secondary" size="sm">
                       <DownloadIcon className="w-4 h-4 mr-2"/> Exportar a Excel
                    </Button>
                    <Button onClick={handleExportToWord} variant="primary" size="sm">
                        <DownloadIcon className="w-4 h-4 mr-2"/> Generar Documento
                    </Button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-xl shadow-sm">
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="font-semibold text-lg text-slate-800">Valoración de Riesgo Inicial</h3>
                            </div>
                            <div className="p-4 flex flex-wrap gap-2 min-h-[60px] items-center">
                                {Object.entries(riskSummary.initial).map(([label, count]) => (
                                    <RiskSummaryPill key={`initial-${label}`} label={label} count={count} />
                                ))}
                                {Object.keys(riskSummary.initial).length === 0 && <p className="text-sm text-slate-500 px-2">No hay datos.</p>}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm">
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="font-semibold text-lg text-slate-800">Valoración de Riesgo Final</h3>
                            </div>
                            <div className="p-4 flex flex-wrap gap-2 min-h-[60px] items-center">
                                {Object.entries(riskSummary.final).map(([label, count]) => (
                                    <RiskSummaryPill key={`final-${label}`} label={label} count={count} />
                                ))}
                                {Object.keys(riskSummary.final).length === 0 && <p className="text-sm text-slate-500 px-2">No hay datos.</p>}
                            </div>
                        </div>
                    </div>
                    {!isVideo ? (
                        <>
                            <div className="p-4 bg-slate-50 rounded-lg mb-4">
                                <h3 className="font-bold text-lg text-brand-dark mb-2">Detalles de la Evaluación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-600">Fecha:</p>
                                        <p className="text-slate-800">{new Date(evaluation.date).toLocaleString('es-AR')}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-600">Fuente:</p>
                                        <p className="text-slate-800">{evaluation.sourceType}</p>
                                    </div>
                                    <div className="md:col-span-3">
                                        <p className="font-semibold text-slate-600">Análisis Solicitado:</p>
                                        <p className="text-slate-800 italic">"{evaluation.prompt}"</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <div className="md:col-span-1">
                                    <h3 className="font-bold text-lg text-brand-dark mb-2">Evidencia</h3>
                                    {evaluation.media.type.startsWith('image/') ? (
                                        <img
                                            src={`data:${evaluation.media.type};base64,${evaluation.media.data}`}
                                            alt="Evidencia visual"
                                            className="w-full rounded-lg shadow-md"
                                        />
                                    ) : evaluation.media.type === 'application/pdf' ? (
                                        <div className="flex flex-col items-center justify-center p-4 bg-slate-200 rounded-md h-full">
                                            <DocumentTextIcon className="w-16 h-16 text-slate-500" />
                                            <p className="mt-2 text-sm font-semibold text-slate-700 break-all">{evaluation.media.name}</p>
                                        </div>
                                    ) : <p>Formato de archivo no soportado.</p>
                                    }
                                </div>
                                <div className="md:col-span-2">
                                   <h3 className="font-bold text-lg text-brand-dark mb-2">Matriz de Riesgos Identificados</h3>
                                   <RiskAssessmentTable risks={evaluation.risks} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="p-4 bg-slate-50 rounded-lg mb-4">
                                <h3 className="font-bold text-lg text-brand-dark mb-2">Detalles de la Evaluación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div><p className="font-semibold text-slate-600">Fecha:</p><p className="text-slate-800">{new Date(evaluation.date).toLocaleString('es-AR')}</p></div>
                                    <div><p className="font-semibold text-slate-600">Fuente:</p><p className="text-slate-800">{evaluation.sourceType} (Video)</p></div>
                                    <div className="md:col-span-3"><p className="font-semibold text-slate-600">Análisis Solicitado:</p><p className="text-slate-800 italic">"{evaluation.prompt}"</p></div>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-brand-dark mb-2">Matriz de Riesgos Identificados</h3>
                            <RiskAssessmentTable risks={evaluation.risks} />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EvaluationReportModal;