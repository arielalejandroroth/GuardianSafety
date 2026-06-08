import React, { useState, useCallback } from 'react';
import { generateImage, editImage, generateRiskMap } from '../services/geminiService';
import Card from './common/Card';
import TextArea from './common/TextArea';
import Input from './common/Input';
import Select from './common/Select';
import Button from './common/Button';
import { SparklesIcon, DownloadIcon, ImageIcon, PencilIcon, AiVisionIcon, ArrowPathIcon } from './IconComponents';
import FileUpload from './common/FileUpload';
import { Attachment } from '../types';
import RiskMapEditor from './RiskMapEditor';
import EvacuationPlanEditor from './EvacuationPlanEditor';
import ImageCropper from './common/ImageCropper';

type GeneratorMode = 'generate' | 'edit' | 'risk-map' | 'evacuation';

const ImageGenerator: React.FC = () => {
    const [mode, setMode] = useState<GeneratorMode>('generate');
    const [isEditingManually, setIsEditingManually] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [sector, setSector] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [sourceImage, setSourceImage] = useState<Attachment | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

    const handleFileChange = useCallback((files: Attachment[]) => {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                setTempImage(`data:${file.type};base64,${file.data}`);
                setShowCropper(true);
            } else {
                setSourceImage(file);
                setIsEditingManually(false);
            }
        } else {
            setSourceImage(null);
        }
    }, []);

    const handleCropComplete = (croppedImageUrl: string) => {
        const base64Data = croppedImageUrl.split(',')[1];
        setSourceImage({
            id: `crop-${Date.now()}`,
            name: 'imagen-recortada.jpg',
            type: 'image/jpeg',
            data: base64Data
        });
        setShowCropper(false);
        setTempImage(null);
        setIsEditingManually(false);
    };

    const handleGenerate = async () => {
        if (mode !== 'risk-map' && mode !== 'evacuation' && !prompt.trim()) {
            setError('Por favor, ingrese una descripción.');
            return;
        }
        
        if ((mode === 'edit' || mode === 'risk-map' || mode === 'evacuation') && !sourceImage) {
            setError('Por favor, suba una imagen o plano de origen.');
            return;
        }

        if ((mode === 'risk-map' || mode === 'evacuation') && !sector.trim()) {
            setError('Por favor, especifique el sector de la planta.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            let base64Image = '';
            if (mode === 'generate') {
                if (sourceImage) {
                    // Use image-to-image if source image is provided
                    base64Image = await editImage(sourceImage.data, sourceImage.type, prompt);
                } else {
                    base64Image = await generateImage(prompt, aspectRatio);
                }
            } else if (mode === 'edit') {
                if (sourceImage) {
                    base64Image = await editImage(sourceImage.data, sourceImage.type, prompt);
                }
            } else if (mode === 'risk-map' || mode === 'evacuation') {
                if (sourceImage) {
                    // Reuse risk map AI generation for evacuation if manual is not used
                    base64Image = await generateRiskMap(sourceImage.data, sourceImage.type, sector, prompt || "Diseñar plano de evacuación profesional");
                }
            }
            
            setImageUrl(`data:image/jpeg;base64,${base64Image}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        const fileName = mode === 'risk-map' || mode === 'evacuation' ? `plano-seguridad-${sector.toLowerCase().replace(/\s+/g, '-')}.png` : `safetyguard-ai-${Date.now()}.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleManualEditToggle = () => {
        if (!sourceImage) {
            setError('Debe cargar un plano primero.');
            return;
        }
        if (!sector) {
            setError('Debe especificar el sector antes de editar.');
            return;
        }
        setIsEditingManually(!isEditingManually);
    };

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-white">
            {showCropper && tempImage && (
                <ImageCropper 
                    image={tempImage} 
                    onCropComplete={handleCropComplete} 
                    onCancel={() => { setShowCropper(false); setTempImage(null); }}
                    aspect={mode === 'evacuation' || mode === 'risk-map' ? 16 / 9 : undefined}
                />
            )}
            
            <div className="bg-slate-900 p-8 text-white">
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Estudio Creativo de Seguridad IA</h2>
                <p className="text-slate-400 font-medium">Diseño profesional de cartelería y planos asistido por inteligencia artificial.</p>
            </div>
            
            <div className="p-8">
                {/* Mode Switcher */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {[
                        { id: 'generate', icon: <ImageIcon className="w-5 h-5" />, label: 'Generar (IA)' },
                        { id: 'edit', icon: <PencilIcon className="w-5 h-5" />, label: 'Editar Imagen' },
                        { id: 'risk-map', icon: <AiVisionIcon className="w-5 h-5" />, label: 'Mapa de Riesgos' },
                        { id: 'evacuation', icon: <AiVisionIcon className="w-5 h-5" />, label: 'Plano de Evacuación' }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => { setMode(m.id as GeneratorMode); setError(null); setImageUrl(null); setIsEditingManually(false); }}
                            className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${mode === m.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <span className="mr-2">{m.icon}</span>
                            {m.label}
                        </button>
                    ))}
                </div>

                {(mode === 'risk-map' || mode === 'evacuation') && isEditingManually && sourceImage ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-700">
                            Diseñador de {mode === 'risk-map' ? 'Mapa de Riesgos' : 'Plano de Evacuación'}: {sector}
                        </h3>
                        <Button variant="secondary" onClick={handleManualEditToggle}>
                            <ArrowPathIcon className="w-4 h-4 mr-2" /> Volver al Inicio
                        </Button>
                    </div>
                    {mode === 'risk-map' ? (
                        <RiskMapEditor 
                            source={sourceImage} 
                            sector={sector} 
                            onExport={(url) => setImageUrl(url)} 
                        />
                    ) : (
                        <EvacuationPlanEditor 
                            source={sourceImage} 
                            sector={sector} 
                            onExport={(url) => setImageUrl(url)} 
                        />
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inputs Column */}
                    <div className="space-y-6">
                        {(mode === 'generate' || mode === 'edit' || mode === 'risk-map' || mode === 'evacuation') && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-slate-700 mb-2">
                                    {mode === 'generate' ? 'Imagen de Referencia (Opcional)' : 
                                     (mode === 'risk-map' || mode === 'evacuation') ? 'Plano o Imagen del Sector' : 'Imagen de Origen'}
                                </h3>
                                <FileUpload onFilesChange={handleFileChange} multiple={false} />
                                {sourceImage && (
                                    <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Archivo cargado</p>
                                            <button 
                                                onClick={() => {
                                                    setTempImage(`data:${sourceImage.type};base64,${sourceImage.data}`);
                                                    setShowCropper(true);
                                                }}
                                                className="text-[10px] bg-brand-light text-brand-primary px-2 py-1 rounded font-bold hover:bg-brand-primary hover:text-white transition-colors"
                                            >
                                                RECORTAR
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {sourceImage.type.startsWith('image/') ? (
                                                <img src={`data:${sourceImage.type};base64,${sourceImage.data}`} alt="Preview" className="h-16 w-16 rounded-lg object-cover border shadow-sm" />
                                            ) : (
                                                <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center border">
                                                    <AiVisionIcon className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{sourceImage.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-medium">{sourceImage.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(mode === 'risk-map' || mode === 'evacuation') && (
                            <div className="space-y-4">
                                <Input 
                                    label="Sector de la Planta" 
                                    value={sector} 
                                    onChange={(e) => setSector(e.target.value)} 
                                    placeholder="Ej: Despostada, Playa de Faena, Industrializado..." 
                                />
                                <div className="p-4 bg-brand-light rounded-lg border border-brand-primary/20">
                                    <h4 className="text-sm font-bold text-brand-primary mb-1">Diseñador Manual Especializado</h4>
                                    <p className="text-xs text-brand-dark mb-4">
                                        {mode === 'evacuation' 
                                            ? "Utiliza nuestra herramienta profesional para crear un Diagrama de Evacuación oficial con encabezados, instrucciones y simbología ISO 7010." 
                                            : "Coloca marcadores de riesgo exactos sobre el plano y genera una leyenda profesional de seguridad."}
                                    </p>
                                    <Button 
                                        onClick={handleManualEditToggle} 
                                        disabled={!sourceImage || !sector} 
                                        variant="primary" 
                                        className="w-full"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" /> Iniciar Diseñador Profesional
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <TextArea
                                label={mode === 'generate' ? "Descripción de la Imagen (Prompt)" : "Instrucciones para la IA (Opcional)"}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={5}
                                placeholder={
                                    mode === 'risk-map' || mode === 'evacuation'
                                    ? "Ej: Resaltar zona de tránsito de autoelevadores en rojo. Marcar zona de uso de guantes de malla. Indicar ubicación de extintores."
                                    : (mode === 'generate' 
                                        ? "Ej: Un trabajador de la construcción con casco y arnés de seguridad sobre un fondo de ciudad futurista, estilo realista." 
                                        : "Ej: Cambiar el color del casco a rojo. / Agregar gafas de seguridad al operario.")
                                }
                            />
                        </div>

                        {mode === 'generate' && (
                            <Select label="Relación de Aspecto" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                                {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                            </Select>
                        )}

                        <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading} className="w-full" variant="primary">
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            {mode === 'generate' ? 'Generar Imagen' : (mode === 'edit' ? 'Editar Imagen' : 'Diseñar con IA')}
                        </Button>
                    </div>

                    {/* Output Column */}
                    <div className="flex flex-col h-full">
                        <h3 className="font-semibold text-slate-700 mb-2">Resultado Visual</h3>
                        <div className="bg-slate-100 rounded-lg flex-grow flex items-center justify-center min-h-[400px] p-4 border border-slate-200 relative overflow-hidden preview-grid">
                            {isLoading && (
                                <div className="flex flex-col items-center">
                                    <svg className="animate-spin h-10 w-10 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-slate-500 font-medium">Procesando Diseño con IA...</span>
                                    <p className="text-xs text-slate-400 mt-2">Esto puede tomar hasta 30 segundos</p>
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-center p-4">
                                    <p className="text-red-500 font-medium">Error en la Generación</p>
                                    <p className="text-slate-600 text-sm">{error}</p>
                                </div>
                            )}
                            
                            {!isLoading && !error && !imageUrl && (
                                <div className="text-center text-slate-400">
                                    {(mode === 'risk-map' || mode === 'evacuation') ? <AiVisionIcon className="w-20 h-20 mx-auto mb-4 opacity-30" /> : <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />}
                                    <p className="max-w-[250px] mx-auto">
                                        {mode === 'evacuation' 
                                            ? "Sube un plano y usa el Diseñador Profesional para crear tu Diagrama de Evacuación oficial." 
                                            : "La imagen generada aparecerá aquí."}
                                    </p>
                                </div>
                            )}

                            {imageUrl && !isLoading && (
                                <div className="relative">
                                    <img src={imageUrl} alt="Generated result" className="max-w-full max-h-[600px] object-contain rounded-md shadow-lg" />
                                    <div className="absolute top-4 right-4 bg-white/90 text-brand-primary text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm border border-brand-primary/10 tracking-widest uppercase">
                                        Diseño Profesional
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {imageUrl && !isLoading && (
                            <div className="mt-4 flex justify-between items-center">
                                <p className="text-xs text-slate-500 italic">Diseño asistido por IA SafetyGuard</p>
                                <Button onClick={handleDownload} variant="secondary">
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Descargar {mode === 'risk-map' || mode === 'evacuation' ? 'Plano Final' : 'Imagen'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </Card>
    );
};

export default ImageGenerator;