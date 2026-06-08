import React from 'react';
import { RiskItem } from '../types';

interface RiskAssessmentTableProps {
    risks: RiskItem[];
}

const RiskAssessmentTable: React.FC<RiskAssessmentTableProps> = ({ risks }) => {

    const getRiskColorClass = (classification: string) => {
        if (!classification) return 'bg-slate-200 text-slate-800';
        const lowerClass = classification.toLowerCase();
        if (lowerClass.includes('alto') || lowerClass.includes('crítico')) return 'bg-red-500 text-white';
        if (lowerClass.includes('medio')) return 'bg-yellow-400 text-slate-800';
        if (lowerClass.includes('bajo')) return 'bg-green-500 text-white';
        return 'bg-slate-200 text-slate-800';
    };

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-xs divide-y divide-slate-200">
                <thead className="bg-slate-100">
                    <tr>
                        <th colSpan={8} className="px-2 py-2 text-center text-slate-700 font-semibold bg-blue-100">Identificación</th>
                        <th colSpan={7} className="px-2 py-2 text-center text-slate-700 font-semibold bg-orange-100">Evaluación Inicial</th>
                        <th colSpan={7} className="px-2 py-2 text-center text-slate-700 font-semibold bg-indigo-100">Controles</th>
                        <th colSpan={4} className="px-2 py-2 text-center text-slate-700 font-semibold bg-green-100">Evaluación Final</th>
                        <th colSpan={2} className="px-2 py-2 text-center text-slate-700 font-semibold bg-purple-100">Plan de Acción</th>
                    </tr>
                    <tr className="bg-slate-200">
                        {/* Identificación */}
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Ítem</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Sector</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Área</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Puesto</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Tarea</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">R/N</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Peligros</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Riesgo</th>
                        {/* Evaluación Inicial */}
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Frec. Exp.</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Control</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Consec.</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">F</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">C</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">Ctr</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">NR Inicial</th>
                        {/* Controles */}
                        <th className="px-1 py-2 text-center font-medium text-slate-600">E</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">S</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">CI</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">SAC</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">EPP</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Detalle</th>
                        {/* Evaluación Final */}
                        <th className="px-1 py-2 text-center font-medium text-slate-600">Prob.</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">Consec.</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">NR Final</th>
                        <th className="px-1 py-2 text-center font-medium text-slate-600">Clasif. Final</th>
                        {/* Plan de Acción */}
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Acciones Req.</th>
                        <th className="px-1 py-2 text-left font-medium text-slate-600">Procedimiento</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {risks.map((risk, idx) => (
                        <tr key={idx}>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.item}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.sector}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.area}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.puesto}</td>
                            <td className="px-1 py-2 min-w-[150px]">{risk.tarea}</td>
                            <td className="px-1 py-2 text-center">{risk.rutinaria}</td>
                            <td className="px-1 py-2 min-w-[150px]">{risk.peligros}</td>
                            <td className="px-1 py-2 min-w-[150px]">{risk.riesgo}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.frecuenciaExposicion}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.control}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.consecuencia}</td>
                            <td className="px-1 py-2 text-center">{risk.valorFrecuencia}</td>
                            <td className="px-1 py-2 text-center">{risk.valorConsecuencia}</td>
                            <td className="px-1 py-2 text-center">{risk.valorControl}</td>
                            <td className={`px-1 py-2 text-center font-bold ${getRiskColorClass(risk.clasificacionRiesgoInicial)}`}>{risk.nivelRiesgoInicial}</td>
                            <td className="px-1 py-2 text-center">{risk.eliminacion}</td>
                            <td className="px-1 py-2 text-center">{risk.sustitucion}</td>
                            <td className="px-1 py-2 text-center">{risk.controlesIngenieria}</td>
                            <td className="px-1 py-2 text-center">{risk.sac}</td>
                            <td className="px-1 py-2 text-center">{risk.epp}</td>
                            <td className="px-1 py-2 min-w-[150px]">{risk.detalleControles}</td>
                            <td className="px-1 py-2 text-center">{risk.probOcurrenciaFinal}</td>
                            <td className="px-1 py-2 text-center">{risk.consecuenciaFinal}</td>
                            <td className={`px-1 py-2 text-center font-bold ${getRiskColorClass(risk.clasificacionRiesgoFinal)}`}>{risk.nivelRiesgoFinal}</td>
                            <td className={`px-1 py-2 text-center font-semibold`}>{risk.clasificacionRiesgoFinal}</td>
                            <td className="px-1 py-2 min-w-[200px]">{risk.accionesRequeridas}</td>
                            <td className="px-1 py-2 whitespace-nowrap">{risk.procedimiento}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RiskAssessmentTable;