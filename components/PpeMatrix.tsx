
import React, { useState, useCallback } from 'react';
import { ppeData, jobTitles, PpeItem } from '../data/ppeData';
import { getEPPAdvice } from '../services/geminiService';
import Card from './common/Card';
import Select from './common/Select';
import Button from './common/Button';
import Modal from './common/Modal';
import { SparklesIcon, HardHatIcon } from './IconComponents';

const PpeCard: React.FC<{ item: PpeItem; isSelected: boolean; onSelect: () => void; }> = ({ item, isSelected, onSelect }) => {
    const selectionClass = isSelected ? 'ring-2 ring-brand-primary ring-offset-2' : 'hover:shadow-lg';
    return (
        <div 
            onClick={onSelect}
            className={`cursor-pointer rounded-lg bg-white shadow-md overflow-hidden transition-all duration-200 ${selectionClass}`}
        >
            <div className="bg-slate-100 flex items-center justify-center p-2 h-32">
                <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="p-3 text-center">
                <p className="text-sm font-semibold text-slate-700">{item.name}</p>
            </div>
        </div>
    );
};

const PpeMatrix: React.FC = () => {
    const [selectedJob, setSelectedJob] = useState(jobTitles[0]);
    const [selectedPpe, setSelectedPpe] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [advice, setAdvice] = useState('');
    const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

    const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedJob(e.target.value);
        setSelectedPpe([]);
    };

    const togglePpeSelection = (ppeName: string) => {
        setSelectedPpe(prev => 
            prev.includes(ppeName) ? prev.filter(p => p !== ppeName) : [...prev, ppeName]
        );
    };

    const handleGetAdvice = useCallback(async () => {
        if (selectedPpe.length === 0) return;
        setIsModalOpen(true);
        setIsLoadingAdvice(true);
        setAdvice('');
        try {
            const result = await getEPPAdvice(selectedPpe);
            setAdvice(result);
        } catch (error) {
            console.error(error);
            setAdvice('No se pudo obtener el asesoramiento. Por favor, intente de nuevo.');
        } finally {
            setIsLoadingAdvice(false);
        }
    }, [selectedPpe]);

    const currentPpeList = ppeData[selectedJob] || [];

    return (
        <Card>
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <HardHatIcon className="h-8 w-8 text-brand-primary" />
                    <h2 className="text-2xl font-bold text-slate-800">Matriz de Elementos de Protección Personal (EPP)</h2>
                </div>
            </div>

            <div className="mb-6 max-w-lg">
                <Select label="Seleccione un Puesto de Trabajo" value={selectedJob} onChange={handleJobChange}>
                    {jobTitles.map(job => (
                        <option key={job} value={job}>{job}</option>
                    ))}
                </Select>
            </div>

            <h3 className="text-lg font-semibold text-slate-700 mb-2">EPP Requeridos para: <span className="text-brand-primary">{selectedJob}</span></h3>
            <p className="text-sm text-slate-500 mb-4">Seleccione uno o más EPP para obtener asesoramiento sobre su uso y cuidado.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {currentPpeList.map(item => (
                    <PpeCard 
                        key={item.name}
                        item={item}
                        isSelected={selectedPpe.includes(item.name)}
                        onSelect={() => togglePpeSelection(item.name)}
                    />
                ))}
            </div>
            
            <div className="mt-8 text-center">
                <Button 
                    onClick={handleGetAdvice}
                    disabled={selectedPpe.length === 0}
                    size="lg"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Obtener Asesoramiento con IA ({selectedPpe.length})
                </Button>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Asesoramiento sobre EPP" size="lg">
                {isLoadingAdvice ? (
                     <div className="flex items-center justify-center p-8 min-h-[200px]">
                        <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="ml-4 text-slate-600">Generando capacitación...</p>
                    </div>
                ) : (
                    <div className="prose max-w-none max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}></div>
                )}
            </Modal>
        </Card>
    );
};

export default PpeMatrix;
