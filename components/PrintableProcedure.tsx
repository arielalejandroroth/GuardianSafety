import React, { forwardRef } from 'react';
import { SafeWorkProcedure } from '../types';
import { swiftLogoBase64 } from '../assets/logo';

interface PrintableProcedureProps {
    procedure: SafeWorkProcedure;
}

const PrintableProcedure = forwardRef<HTMLDivElement, PrintableProcedureProps>(({ procedure }, ref) => {
    
    const renderContentWithBreaks = (content: string) => {
        return content.split('\n').map((line, index) => {
            if (!line.trim()) return <p key={index} style={{ margin: '4px 0', minHeight: '1em' }}>&nbsp;</p>; // Keep empty lines
            
            const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
            const renderedLine = parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                }
                return part;
            });

            return <p key={index} style={{ margin: '4px 0' }}>{renderedLine}</p>;
        });
    };
    
    return (
        <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '10mm', backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '25%', padding: '8px', border: '1.5px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
                            <img src={swiftLogoBase64} alt="Swift Logo" style={{ maxWidth: '80%', height: 'auto' }} />
                        </td>
                        <td style={{ width: '75%', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', border: '1.5px solid black', verticalAlign: 'middle' }}>
                            Swift Argentina S.A.
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Info Block */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black', borderTop: 'none', fontSize: '11px', tableLayout: 'fixed' }}>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black', width: '15%' }}>Tipo:</td>
                        <td colSpan={3} style={{ padding: '4px', border: '1.5px solid black' }}>Procedimiento</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black' }}>Código:</td>
                        <td colSpan={3} style={{ padding: '4px', border: '1.5px solid black' }}>{procedure.codigo}</td>
                    </tr>
                     <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black' }}>Título:</td>
                        <td colSpan={3} style={{ padding: '4px', border: '1.5px solid black' }}>{procedure.titulo}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black' }}>Manual:</td>
                        <td colSpan={3} style={{ padding: '4px', border: '1.5px solid black' }}>{procedure.manual}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black' }}>Nº Revisión:</td>
                        <td style={{ padding: '4px', border: '1.5px solid black', width: '35%' }}>{procedure.revision}</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }} colSpan={2}></td>
                    </tr>
                     <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black', verticalAlign: 'middle' }}>Revisión:</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }}><strong style={{fontWeight: 'bold'}}>Realizado:</strong> {procedure.realizado}</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }}><strong style={{fontWeight: 'bold'}}>Revisado:</strong> {procedure.revisado}</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }}><strong style={{fontWeight: 'bold'}}>Aprobado:</strong> {procedure.aprobado}</td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black' }}>Fecha:</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }}>{procedure.fecha}</td>
                        <td style={{ fontWeight: 'bold', padding: '4px', border: '1.5px solid black', width: '15%' }}>Responsable:</td>
                        <td style={{ padding: '4px', border: '1.5px solid black' }}>{procedure.responsable}</td>
                    </tr>
                </tbody>
            </table>
            
            {/* Content */}
            <div style={{ marginTop: '20px', fontSize: '12px', lineHeight: '1.5' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px' }}>1. Objetivo</h2>
                <p>{procedure.objetivo}</p>

                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '15px' }}>2. Alcance</h2>
                <p>{procedure.alcance}</p>

                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '15px' }}>3. Desarrollo</h2>
                <div>{renderContentWithBreaks(procedure.desarrollo)}</div>
                
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '15px' }}>4. Responsabilidades</h2>
                 <div>{renderContentWithBreaks(procedure.responsabilidades)}</div>

                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '15px' }}>5. Anexos</h2>
                <p>{procedure.anexos}</p>
                
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '15px' }}>6. Documentos de Referencia</h2>
                <p>{procedure.documentosReferencia}</p>
            </div>
        </div>
    );
});

export default PrintableProcedure;
