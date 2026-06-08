import React, { useState } from 'react';
import { RiskEvaluation, SafeWorkProcedure } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import { DownloadIcon } from './IconComponents';
import FormSection from './common/FormSection';
import { getCorporateHeaderHtml } from '../utils/corporateHeader';

interface ProcedureViewModalProps {
    evaluation: RiskEvaluation;
    onClose: () => void;
    onSave: (updatedEvaluation: RiskEvaluation) => void;
}

const ProcedureViewModal: React.FC<ProcedureViewModalProps> = ({ evaluation, onClose, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [procedureData, setProcedureData] = useState<SafeWorkProcedure>(evaluation.procedure!);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProcedureData(prev => ({ ...prev!, [name]: value }));
    };

    const handleSave = () => {
        onSave({ ...evaluation, procedure: procedureData });
        setIsEditing(false);
    };
    
    const handleExportToWord = () => {
        const procedure = procedureData;
        if (!procedure) return;
        
        const renderContentToHtml = (content: string) => {
          if (!content) return '';
          let html = '';
          let inList = false;
          content.split('\n').forEach(line => {
            let processedLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            if (processedLine.trim().startsWith('- ')) {
              if (!inList) {
                html += '<ul style="margin: 0; padding-left: 40px;">';
                inList = true;
              }
              html += `<li style="margin-bottom: 4px;">${processedLine.trim().substring(2)}</li>`;
            } else {
              if (inList) {
                html += '</ul>';
                inList = false;
              }
              if (processedLine.trim() === '') {
                html += '<p style="margin: 8px 0; min-height: 1em;">&nbsp;</p>';
              } else {
                html += `<p style="margin: 4px 0;">${processedLine}</p>`;
              }
            }
          });
          if (inList) {
            html += '</ul>';
          }
          return html;
        };

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${procedure.titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12pt; }
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1.5px solid black; padding: 4px 8px; vertical-align: top; }
                h1, h2, h3 { color: #333; }
                p { margin: 4px 0; }
                strong { font-weight: bold; }
                ul { margin-top: 0; padding-left: 40px; }
            </style>
            </head>
            <body>
                <div style="width: 210mm; margin: 0 auto; padding: 10mm;">
                     ${getCorporateHeaderHtml()}
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid black; font-size: 11px; table-layout: fixed;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black; width: 15%;">Tipo:</td>
                                <td colspan="3" style="padding: 4px; border: 1.5px solid black;">Procedimiento</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black;">Código:</td>
                                <td colspan="3" style="padding: 4px; border: 1.5px solid black;">${procedure.codigo}</td>
                            </tr>
                             <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black;">Título:</td>
                                <td colspan="3" style="padding: 4px; border: 1.5px solid black;">${procedure.titulo}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black;">Manual:</td>
                                <td colspan="3" style="padding: 4px; border: 1.5px solid black;">${procedure.manual}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black;">Nº Revisión:</td>
                                <td style="padding: 4px; border: 1.5px solid black; width: 35%;">${procedure.revision}</td>
                                <td style="padding: 4px; border: 1.5px solid black;" colspan="2"></td>
                            </tr>
                             <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black; vertical-align: middle;">Revisión:</td>
                                <td style="padding: 4px; border: 1.5px solid black;"><strong>Realizado:</strong> ${procedure.realizado}</td>
                                <td style="padding: 4px; border: 1.5px solid black;"><strong>Revisado:</strong> ${procedure.revisado}</td>
                                <td style="padding: 4px; border: 1.5px solid black;"><strong>Aprobado:</strong> ${procedure.aprobado}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black;">Fecha:</td>
                                <td style="padding: 4px; border: 1.5px solid black;">${procedure.fecha}</td>
                                <td style="font-weight: bold; padding: 4px; border: 1.5px solid black; width: 15%;">Responsable:</td>
                                <td style="padding: 4px; border: 1.5px solid black;">${procedure.responsable}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-top: 20px; font-size: 12px; line-height: 1.5;">
                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px;">1. Objetivo</h2>
                        <p>${procedure.objetivo}</p>

                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 15px;">2. Alcance</h2>
                        <p>${procedure.alcance}</p>

                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 15px;">3. Desarrollo</h2>
                        <div>${renderContentToHtml(procedure.desarrollo)}</div>
                        
                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 15px;">4. Responsabilidades</h2>
                         <div>${renderContentToHtml(procedure.responsabilidades)}</div>

                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 15px;">5. Anexos</h2>
                        <p>${procedure.anexos}</p>
                        
                        <h2 style="font-size: 14px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 15px;">6. Documentos de Referencia</h2>
                        <p>${procedure.documentosReferencia}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `PTS_${procedure.codigo}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const renderContent = (content: string) => {
        const sections = content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
                return <strong key={i} className="font-bold block mt-2">{line.replace(/\*\*/g, '')}</strong>;
            }
            if (line.startsWith('- ')) {
                return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
            }
            return <p key={i}>{line}</p>;
        });
        return <div>{sections}</div>;
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Procedimiento: ${procedureData.titulo}`} size="4xl">
            <div className="space-y-4">
                <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                           <Button onClick={() => setIsEditing(false)} variant="secondary">Cancelar</Button>
                           <Button onClick={handleSave} variant="primary">Guardar Cambios</Button>
                        </>
                    ) : (
                        <>
                           <Button onClick={() => setIsEditing(true)} variant="secondary">Editar</Button>
                           <Button onClick={handleExportToWord} variant="primary">
                                <DownloadIcon className="w-4 h-4 mr-2" /> Generar Documento
                           </Button>
                        </>
                    )}
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-4 border rounded-lg bg-slate-50">
                    {isEditing ? (
                         <div className="space-y-4">
                            <FormSection title="Metadatos del Documento" initiallyOpen={true}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Input label="Código" name="codigo" value={procedureData.codigo} onChange={handleInputChange} />
                                    <Input label="Nº Revisión" name="revision" value={procedureData.revision} onChange={handleInputChange} />
                                    <Input label="Fecha" name="fecha" value={procedureData.fecha} onChange={handleInputChange} />
                                    <Input label="Manual" name="manual" value={procedureData.manual} onChange={handleInputChange} />
                                    <Input label="Realizado por" name="realizado" value={procedureData.realizado} onChange={handleInputChange} />
                                    <Input label="Revisado por" name="revisado" value={procedureData.revisado} onChange={handleInputChange} />
                                    <Input label="Aprobado por" name="aprobado" value={procedureData.aprobado} onChange={handleInputChange} />
                                    <Input label="Responsable" name="responsable" value={procedureData.responsable} onChange={handleInputChange} />
                                </div>
                            </FormSection>
                            <FormSection title="Contenido del Procedimiento" initiallyOpen={true}>
                                <Input label="Título" name="titulo" value={procedureData.titulo} onChange={handleInputChange} />
                                <TextArea label="Objetivo" name="objetivo" value={procedureData.objetivo} onChange={handleInputChange} rows={3} />
                                <TextArea label="Alcance" name="alcance" value={procedureData.alcance} onChange={handleInputChange} rows={3} />
                                <TextArea label="Desarrollo" name="desarrollo" value={procedureData.desarrollo} onChange={handleInputChange} rows={15} />
                                <TextArea label="Responsabilidades" name="responsabilidades" value={procedureData.responsabilidades} onChange={handleInputChange} rows={8} />
                                <TextArea label="Anexos" name="anexos" value={procedureData.anexos} onChange={handleInputChange} rows={2} />
                                <TextArea label="Documentos de Referencia" name="documentosReferencia" value={procedureData.documentosReferencia} onChange={handleInputChange} rows={2} />
                            </FormSection>
                         </div>
                    ) : (
                        <div className="prose max-w-none">
                            <h3 className="font-bold">1. Objetivo</h3>
                            <p>{procedureData.objetivo}</p>
                            <h3 className="font-bold mt-4">2. Alcance</h3>
                            <p>{procedureData.alcance}</p>
                            <h3 className="font-bold mt-4">3. Desarrollo</h3>
                            {renderContent(procedureData.desarrollo)}
                            <h3 className="font-bold mt-4">4. Responsabilidades</h3>
                            {renderContent(procedureData.responsabilidades)}
                            <h3 className="font-bold mt-4">5. Anexos</h3>
                            <p>{procedureData.anexos}</p>
                             <h3 className="font-bold mt-4">6. Documentos de Referencia</h3>
                            <p>{procedureData.documentosReferencia}</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProcedureViewModal;