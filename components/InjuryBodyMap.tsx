import React, { useMemo, useState } from 'react';
import { AccidentReport } from '../types';
import { mascotFrontView, mascotBackView } from '../assets/bodyImages';
import Card from './common/Card';
import MultiSelectDropdown from './common/MultiSelectDropdown';
import Button from './common/Button';
import Modal from './common/Modal';

interface BodyPartConfig {
    [key: string]: { x: number; y: number; name: string };
}

const bodyPartConfigFront: BodyPartConfig = {
    cabeza: { x: 50, y: 12, name: 'Cabeza' },
    rostro: { x: 50, y: 18, name: 'Rostro' },
    ojo: { x: 50, y: 17, name: 'Ojo/s' },
    boca: { x: 50, y: 21, name: 'Boca' },
    cuello: { x: 50, y: 27, name: 'Cuello' },
    hombro_derecho: { x: 38, y: 31, name: 'Hombro Derecho' },
    hombro_izquierdo: { x: 62, y: 31, name: 'Hombro Izquierdo' },
    pecho: { x: 50, y: 36, name: 'Pecho' },
    torso: { x: 50, y: 42, name: 'Torso' },
    abdomen: { x: 50, y: 48, name: 'Abdomen' },
    brazo_derecho: { x: 30, y: 40, name: 'Brazo Derecho' },
    brazo_izquierdo: { x: 70, y: 40, name: 'Brazo Izquierdo' },
    codo_derecho: { x: 24, y: 45, name: 'Codo Derecho' },
    codo_izquierdo: { x: 76, y: 45, name: 'Codo Izquierdo' },
    antebrazo_derecho: { x: 28, y: 50, name: 'Antebrazo Derecho' },
    antebrazo_izquierdo: { x: 72, y: 50, name: 'Antebrazo Izquierdo' },
    muñeca_derecha: { x: 25, y: 55, name: 'Muñeca Derecha' },
    muñeca_izquierda: { x: 75, y: 55, name: 'Muñeca Izquierda' },
    mano_derecha: { x: 22, y: 58, name: 'Mano Derecha' },
    mano_izquierda: { x: 78, y: 58, name: 'Mano Izquierda' },
    cadera: { x: 50, y: 55, name: 'Cadera' },
    pierna_derecha: { x: 42, y: 75, name: 'Pierna Derecha' },
    pierna_izquierda: { x: 58, y: 75, name: 'Pierna Izquierda' },
    muslo_derecho: { x: 42, y: 65, name: 'Muslo Derecho' },
    muslo_izquierdo: { x: 58, y: 65, name: 'Muslo Izquierdo' },
    rodilla_derecha: { x: 41, y: 80, name: 'Rodilla Derecha' },
    rodilla_izquierda: { x: 59, y: 80, name: 'Rodilla Izquierda' },
    tobillo_derecho: { x: 40, y: 92, name: 'Tobillo Derecho' },
    tobillo_izquierdo: { x: 60, y: 92, name: 'Tobillo Izquierdo' },
    pie_derecho: { x: 38, y: 96, name: 'Pie Derecho' },
    pie_izquierdo: { x: 62, y: 96, name: 'Pie Izquierdo' },
};

const bodyPartConfigBack: BodyPartConfig = {
    cabeza: { x: 50, y: 12, name: 'Cabeza' },
    nuca: { x: 50, y: 26, name: 'Nuca' },
    hombro_derecho: { x: 38, y: 31, name: 'Hombro Derecho' },
    hombro_izquierdo: { x: 62, y: 31, name: 'Hombro Izquierdo' },
    espalda: { x: 50, y: 42, name: 'Espalda' },
    columna: { x: 50, y: 45, name: 'Columna' },
    brazo_derecho: { x: 29, y: 40, name: 'Brazo Derecho' },
    brazo_izquierdo: { x: 71, y: 40, name: 'Brazo Izquierdo' },
    codo_derecho: { x: 24, y: 45, name: 'Codo Derecho' },
    codo_izquierdo: { x: 76, y: 45, name: 'Codo Izquierdo' },
    antebrazo_derecho: { x: 28, y: 50, name: 'Antebrazo Derecho' },
    antebrazo_izquierdo: { x: 72, y: 50, name: 'Antebrazo Izquierdo' },
    muñeca_derecha: { x: 25, y: 55, name: 'Muñeca Derecha' },
    muñeca_izquierda: { x: 75, y: 55, name: 'Muñeca Izquierda' },
    mano_derecha: { x: 22, y: 58, name: 'Mano Derecha' },
    mano_izquierda: { x: 78, y: 58, name: 'Mano Izquierda' },
    pierna_derecha: { x: 42, y: 75, name: 'Pierna Derecha' },
    pierna_izquierda: { x: 58, y: 75, name: 'Pierna Izquierda' },
    muslo_derecho: { x: 42, y: 65, name: 'Muslo Derecho' },
    muslo_izquierdo: { x: 58, y: 65, name: 'Muslo Izquierdo' },
    rodilla_derecha: { x: 41, y: 80, name: 'Rodilla Derecha' },
    rodilla_izquierda: { x: 59, y: 80, name: 'Rodilla Izquierda' },
    tobillo_derecho: { x: 40, y: 92, name: 'Tobillo Derecho' },
    tobillo_izquierdo: { x: 60, y: 92, name: 'Tobillo Izquierdo' },
    pie_derecho: { x: 38, y: 96, name: 'Pie Derecho' },
    pie_izquierdo: { x: 62, y: 96, name: 'Pie Izquierdo' },
};

const normalizeBodyPart = (part: string): string[] => {
    if (typeof part !== 'string' || !part) {
        return [];
    }
    const lower = part.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts: string[] = [];

    const isLeft = lower.includes('izquierd');
    const isRight = lower.includes('derech');

    const addPart = (key: string) => parts.push(key);
    
    if (lower.includes('cabeza')) addPart('cabeza');
    if (lower.includes('rostro') || lower.includes('cara')) addPart('rostro');
    if (lower.includes('ojo')) addPart('ojo');
    if (lower.includes('boca') || lower.includes('labio')) addPart('boca');
    if (lower.includes('cuello')) addPart('cuello');
    if (lower.includes('hombro')) { isLeft ? addPart('hombro_izquierdo') : isRight ? addPart('hombro_derecho') : (addPart('hombro_izquierdo'), addPart('hombro_derecho')); }
    if (lower.includes('pecho')) addPart('pecho');
    if (lower.includes('torso')) addPart('torso');
    if (lower.includes('abdomen')) addPart('abdomen');
    if (lower.includes('brazo')) { isLeft ? addPart('brazo_izquierdo') : isRight ? addPart('brazo_derecho') : (addPart('brazo_izquierdo'), addPart('brazo_derecho')); }
    if (lower.includes('codo')) { isLeft ? addPart('codo_izquierdo') : isRight ? addPart('codo_derecho') : (addPart('codo_izquierdo'), addPart('codo_derecho')); }
    if (lower.includes('antebrazo')) { isLeft ? addPart('antebrazo_izquierdo') : isRight ? addPart('antebrazo_derecho') : (addPart('antebrazo_izquierdo'), addPart('antebrazo_derecho')); }
    if (lower.includes('muñeca')) { isLeft ? addPart('muñeca_izquierda') : isRight ? addPart('muñeca_derecha') : (addPart('muñeca_izquierda'), addPart('muñeca_derecha')); }
    if (lower.includes('mano')) { isLeft ? addPart('mano_izquierda') : isRight ? addPart('mano_derecha') : (addPart('mano_izquierda'), addPart('mano_derecha')); }
    if (lower.includes('dedo')) { isLeft ? addPart('mano_izquierda') : isRight ? addPart('mano_derecha') : (addPart('mano_izquierda'), addPart('mano_derecha')); }
    if (lower.includes('cadera')) addPart('cadera');
    if (lower.includes('pierna')) { isLeft ? addPart('pierna_izquierda') : isRight ? addPart('pierna_derecha') : (addPart('pierna_izquierda'), addPart('pierna_derecha')); }
    if (lower.includes('muslo')) { isLeft ? addPart('muslo_izquierdo') : isRight ? addPart('muslo_derecho') : (addPart('muslo_izquierdo'), addPart('muslo_derecho')); }
    if (lower.includes('rodilla')) { isLeft ? addPart('rodilla_izquierda') : isRight ? addPart('rodilla_derecha') : (addPart('rodilla_izquierda'), addPart('rodilla_derecha')); }
    if (lower.includes('tobillo')) { isLeft ? addPart('tobillo_izquierdo') : isRight ? addPart('tobillo_derecho') : (addPart('tobillo_izquierdo'), addPart('tobillo_derecha')); }
    if (lower.includes('pie')) { isLeft ? addPart('pie_izquierdo') : isRight ? addPart('pie_derecho') : (addPart('pie_izquierdo'), addPart('pie_derecho')); }
    if (lower.includes('espalda')) addPart('espalda');
    if (lower.includes('nuca')) addPart('nuca');
    if (lower.includes('columna') || lower.includes('lumbar')) addPart('columna');

    return [...new Set(parts)];
};

interface InjuryHotspotProps {
    count: number;
    maxCount: number;
    partConfig: { x: number; y: number; name: string };
    incidents: AccidentReport[];
    onClick: () => void;
}

const InjuryHotspot: React.FC<InjuryHotspotProps> = ({ count, maxCount, partConfig, incidents, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    // Slightly increase size to better accommodate numbers
    const size = 12 + Math.sqrt(count / maxCount) * 30;
    const opacity = 0.6 + (count / maxCount) * 0.4;
    // Add pulse animation for areas with the most incidents for better visual feedback
    const pulseAnimation = count > (maxCount * 0.75) ? 'animate-pulse' : '';

    return (
        <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group" 
            style={{ left: `${partConfig.x}%`, top: `${partConfig.y}%` }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={onClick}
        >
            <div
                className={`rounded-full bg-red-600 border-2 border-white/75 shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 ${pulseAnimation}`}
                style={{ width: `${size}px`, height: `${size}px`, opacity, animationDuration: '1.5s' }}
            >
                <span className="text-white text-sm font-bold pointer-events-none" style={{ textShadow: '0 0 3px black' }}>
                    {count}
                </span>
            </div>
            {showTooltip && (
                <div className="absolute bottom-full mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg shadow-lg p-3 z-20 left-1/2 -translate-x-1/2">
                    <h4 className="font-bold text-sm border-b border-slate-600 pb-1 mb-1">{partConfig.name} ({count} {count > 1 ? 'casos' : 'caso'})</h4>
                    <p className="text-slate-400 text-[10px] italic mb-2">Haz clic para ver detalles</p>
                    <ul className="max-h-40 overflow-y-auto space-y-1">
                        {incidents.slice(0, 5).map(inc => (
                            <li key={inc.id} className="truncate">
                                {inc.id}: {inc.tipoLesion}
                            </li>
                        ))}
                        {incidents.length > 5 && <li className="italic text-slate-400">...y {incidents.length - 5} más</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface InjuryCount {
    count: number;
    incidents: AccidentReport[];
}

const InjuryBodyMap: React.FC<{ accidents: AccidentReport[] }> = ({ accidents }) => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedPartIncidents, setSelectedPartIncidents] = useState<AccidentReport[] | null>(null);

    const filterOptions = useMemo(() => {
        const sectors = new Set(accidents.map(a => a.sector).filter(Boolean));
        const lesionTypes = new Set(accidents.map(a => a.tipoLesion).filter(Boolean));
        return [
            ...Array.from(sectors).map(s => ({ label: `Sector: ${s}`, value: `sector:${s}` })),
            ...Array.from(lesionTypes).map(l => ({ label: `Lesión: ${l}`, value: `lesion:${l}` })),
        ];
    }, [accidents]);
    
    const filteredAccidents = useMemo(() => {
        if (selectedFilters.length === 0) return accidents;
        return accidents.filter(accident => {
            return selectedFilters.every(filter => {
                const [type, value] = filter.split(':');
                if (type === 'sector') return accident.sector === value;
                if (type === 'lesion') return accident.tipoLesion === value;
                return false;
            });
        });
    }, [accidents, selectedFilters]);
    
    const injuryData: Record<string, InjuryCount> = useMemo(() => {
        const data: Record<string, InjuryCount> = {};
        
        filteredAccidents.forEach(accident => {
            const normalizedParts = normalizeBodyPart(accident.parteCuerpoAfectada);
            normalizedParts.forEach(partKey => {
                if (!data[partKey]) {
                    data[partKey] = { count: 0, incidents: [] };
                }
                data[partKey].count++;
                data[partKey].incidents.push(accident);
            });
        });
        return data;
    }, [filteredAccidents]);
    
    const maxCount = useMemo(() => Math.max(1, ...Object.values(injuryData).map(d => d.count)), [injuryData]);

    const renderHotspots = (config: BodyPartConfig) => {
        return Object.entries(config).map(([key, partConfig]) => {
            const data = injuryData[key];
            if (!data || data.count === 0) return null;
            return (
                <InjuryHotspot 
                    key={key}
                    count={data.count}
                    maxCount={maxCount}
                    partConfig={partConfig}
                    incidents={data.incidents}
                    onClick={() => setSelectedPartIncidents(data.incidents)}
                />
            );
        });
    };

    return (
        <Card>
            <div className="md:flex justify-between items-center mb-4">
                <div className="max-w-md">
                    <MultiSelectDropdown 
                        label="Filtrar por Sector o Tipo de Lesión:"
                        options={filterOptions}
                        selectedValues={selectedFilters}
                        onChange={setSelectedFilters}
                    />
                </div>
                 <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <Button size="sm" variant={view === 'front' ? 'primary' : 'secondary'} onClick={() => setView('front')}>Vista Frontal</Button>
                    <Button size="sm" variant={view === 'back' ? 'primary' : 'secondary'} onClick={() => setView('back')}>Vista Posterior</Button>
                </div>
            </div>
            
            <div className="relative w-full max-w-sm mx-auto">
                <img 
                    src={view === 'front' ? mascotFrontView : mascotBackView} 
                    alt={`Vista ${view} del cuerpo`}
                    className="w-full h-auto"
                />
                {view === 'front' ? renderHotspots(bodyPartConfigFront) : renderHotspots(bodyPartConfigBack)}
            </div>

            {selectedPartIncidents && (
                <Modal isOpen={true} onClose={() => setSelectedPartIncidents(null)} title="Detalle de Incidentes" size="lg">
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-slate-600">ID</th>
                                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Colaborador</th>
                                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Lesión</th>
                                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {selectedPartIncidents.map(inc => (
                                    <tr key={inc.id}>
                                        <td className="px-3 py-2 whitespace-nowrap">{inc.id}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{new Date(inc.date).toLocaleDateString('es-AR')}</td>
                                        <td className="px-3 py-2">{inc.collaboratorName}</td>
                                        <td className="px-3 py-2">{inc.tipoLesion}</td>
                                        <td className="px-3 py-2 max-w-xs truncate" title={inc.description}>{inc.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}
        </Card>
    );
};

export default InjuryBodyMap;
