import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InternalAuditFormState, View } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { DocumentAddIcon, PrintIcon } from './IconComponents';
import Modal from './common/Modal';
import { swiftLogoBase64 } from '../assets/logo';

const PrintableAuditReport = React.forwardRef<HTMLDivElement, { audit: InternalAuditFormState }>(({ audit }, ref) => {
    const deviations = audit.checklist.filter(item => item.status === 'No');

    return (
        <div ref={ref} className="p-4 bg-white text-black text-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00529B', paddingBottom: '8px', marginBottom: '16px' }}>
                <img src={swiftLogoBase64} alt="Logo" style={{ height: '50px' }} />
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#002A50', margin: 0 }}>Informe de Auditoría Interna</h1>
            </div>
            
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '1rem 0', color: '#003F7A' }}>1. Información General</h2>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Planta:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.plant}</td><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Fecha:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{new Date(audit.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td></tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Proceso:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.process}</td><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Sector:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.sector}</td></tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Área:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.area}</td><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Puesto:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.puesto}</td></tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Supervisor:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.supervisor}</td><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>N° Operarios:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.operatorCount}</td></tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Auditor Líder:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.auditLead}</td><td style={{ fontWeight: 'bold', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>Equipo Auditor:</td><td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{audit.auditTeam}</td></tr>
                </tbody>
            </table>

            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '1rem 0', color: '#003F7A' }}>2. Hallazgos (Desvíos)</h2>
            {deviations.length > 0 ? (
                <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}><tr style={{ borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Ítem</th><th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Hallazgo</th><th style={{ padding: '8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Normativa</th></tr></thead>
                    <tbody>
                        {deviations.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '8px', verticalAlign: 'top', border: '1px solid #e2e8f0' }}>{item.question}</td><td style={{ padding: '8px', verticalAlign: 'top', border: '1px solid #e2e8f0' }}>{item.comment}</td><td style={{ padding: '8px', verticalAlign: 'top', border: '1px solid #e2e8f0' }}>{item.regulation}</td></tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ fontSize: '0.875rem', padding: '1rem', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '0.375rem' }}>No se encontraron desvíos durante esta auditoría.</p>
            )}

            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '1rem 0', color: '#003F7A' }}>3. Firmas de Conformidad</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ borderTop: '1px solid black', paddingTop: '8px', fontStyle: 'italic', fontFamily: 'cursive', fontSize: '1.1rem' }}>{audit.auditLeadSignature}</p>
                    <p style={{ fontWeight: 'bold' }}>Firma Auditor Líder</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ borderTop: '1px solid black', paddingTop: '8px', fontStyle: 'italic', fontFamily: 'cursive', fontSize: '1.1rem' }}>{audit.supervisorSignature}</p>
                    <p style={{ fontWeight: 'bold' }}>Firma Supervisor de Área</p>
                </div>
            </div>
        </div>
    );
});


interface AuditReportModalProps {
    audit: InternalAuditFormState;
    onClose: () => void;
}

const AuditReportModal: React.FC<AuditReportModalProps> = ({ audit, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async () => {
        const element = printRef.current;
        if (!element) return;

        setIsPrinting(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pdfWidth - 80; // margins 40pt each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 40;

            pdf.addImage(canvas, 'PNG', 40, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 80);

            while (heightLeft > 0) {
                position -= (pdfHeight - 80); // Move position up for the next slice
                pdf.addPage();
                pdf.addImage(canvas, 'PNG', 40, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 80);
            }

            pdf.save(`Auditoria_${audit.sector}_${audit.date}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        } finally {
            setIsPrinting(false);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Informe de Auditoría - ${audit.sector}`} size="4xl">
            <div className="flex justify-end mb-4 no-print">
                <Button onClick={handlePrint} isLoading={isPrinting}>
                    <PrintIcon className="w-5 h-5 mr-2" />
                    Descargar PDF
                </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto border rounded-lg">
                <PrintableAuditReport audit={audit} />
            </div>

            {/* Hidden element for accurate PDF printing */}
            <div className="printable-pdf-area">
                <PrintableAuditReport audit={audit} ref={printRef} />
            </div>
        </Modal>
    );
};


interface AuditsMatrixProps {
  audits: InternalAuditFormState[];
  onNavigate: (view: View) => void;
}

const AuditsMatrix: React.FC<AuditsMatrixProps> = ({ audits, onNavigate }) => {
    const [selectedAudit, setSelectedAudit] = useState<InternalAuditFormState | null>(null);
    const sortedAudits = [...audits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Historial de Auditorías</h2>
                <Button variant="primary" onClick={() => onNavigate(View.AUDIT_FORM)}>
                    <DocumentAddIcon className="h-5 w-5 mr-2" />
                    Nueva Auditoría
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector Auditado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auditor Líder</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Hallazgos</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {sortedAudits.map((audit, index) => (
                            <tr key={`${audit.date}-${index}`}>
                                <td className="px-4 py-4 whitespace-nowrap">{new Date(audit.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td>
                                <td className="px-4 py-4 whitespace-nowrap">{audit.sector}</td>
                                <td className="px-4 py-4 whitespace-nowrap">{audit.auditLead}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">{audit.checklist.filter(i => i.status === 'No').length}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Button size="sm" onClick={() => setSelectedAudit(audit)}>
                                        Ver Informe
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {audits.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    No hay auditorías registradas.
                </div>
            )}
            
            {selectedAudit && <AuditReportModal audit={selectedAudit} onClose={() => setSelectedAudit(null)} />}
        </Card>
    );
};

export default AuditsMatrix;