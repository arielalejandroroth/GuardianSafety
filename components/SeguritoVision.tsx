import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Attachment, RiskEvaluation, View, RiskItem } from '../types';
import Button from './common/Button';
import TextArea from './common/TextArea';
import { generateRiskAssessment } from '../services/geminiService';
import { CameraIcon, UploadIcon, HistoryIcon, SparklesIcon, ArrowPathIcon, AiVisionIcon, DocumentTextIcon } from './IconComponents';
import Card from './common/Card';

interface SeguritoVisionProps {
    onSave: (evaluation: Omit<RiskEvaluation, 'id'>) => void;
    onNavigate: (view: View) => void;
}

const SeguritoVision: React.FC<SeguritoVisionProps> = ({ onSave, onNavigate }) => {
    const [sourceType, setSourceType] = useState<'camera' | 'file'>('file');
    const [media, setMedia] = useState<Attachment | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{ riskItems: RiskItem[]; artClassification?: any } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOn]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || (!file.type.startsWith('image/') && !file.type.startsWith('video/') && file.type !== 'application/pdf')) {
            alert('Por favor, seleccione un archivo de imagen, video o PDF válido.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxDimension = 1080;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    setMedia({
                        name: file.name,
                        type: 'image/jpeg',
                        data: dataUrl.split(',')[1],
                    });
                    setAnalysisResult(null);
                };
                img.src = reader.result as string;
            } else {
                setMedia({
                    name: file.name,
                    type: file.type,
                    data: (reader.result as string).split(',')[1],
                });
                setAnalysisResult(null);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
                setMedia(null);
                setAnalysisResult(null);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("No se pudo acceder a la cámara. Verifique los permisos en su navegador.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    };
    
    const handleSourceChange = (type: 'camera' | 'file') => {
        setSourceType(type);
        stopCamera();
        setMedia(null);
        setAnalysisResult(null);
        if (type === 'camera') {
            startCamera();
        }
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Limit max dimensions to prevent huge payloads
            const maxDimension = 1080;
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setMedia({
                name: `capture-${Date.now()}.jpg`,
                type: 'image/jpeg',
                data: dataUrl.split(',')[1],
            });
            stopCamera();
        }
    };

    const handleAnalyze = async () => {
        if (!media || !prompt.trim()) {
            setError('Debe proporcionar una imagen y una pregunta para el análisis.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await generateRiskAssessment([media], prompt);
            setAnalysisResult(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado durante el análisis.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!media || !analysisResult) return;
        
        const evaluation: Omit<RiskEvaluation, 'id'> = {
            date: new Date().toISOString(),
            sourceType: sourceType === 'camera' ? 'Cámara' : 'Archivo',
            media,
            prompt,
            risks: analysisResult.riskItems,
        };
        onSave(evaluation);
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <AiVisionIcon className="h-8 w-8 text-brand-primary" />
                    <h2 className="text-2xl font-bold text-slate-800">Segurito Vision - Análisis de Riesgos con IA</h2>
                </div>
                <Button variant="secondary" onClick={() => onNavigate(View.EVALUATION_HISTORY)}>
                    <HistoryIcon className="h-5 w-5 mr-2" />
                    Historial de Evaluaciones
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-700">1. Proporcione la Evidencia Visual</h3>
                    <div className="flex space-x-2">
                        <Button onClick={() => handleSourceChange('file')} variant={sourceType === 'file' ? 'primary' : 'secondary'} className="flex-1">
                            <UploadIcon className="w-5 h-5 mr-2" /> Subir Archivo
                        </Button>
                        <Button onClick={() => handleSourceChange('camera')} variant={sourceType === 'camera' ? 'primary' : 'secondary'} className="flex-1">
                            <CameraIcon className="w-5 h-5 mr-2" /> Usar Cámara
                        </Button>
                    </div>

                    <div className="p-4 bg-slate-100 rounded-lg min-h-[300px] flex items-center justify-center">
                        {sourceType === 'file' && !media && (
                           <button onClick={() => fileInputRef.current?.click()} className="text-center text-slate-500 hover:text-brand-primary">
                               <UploadIcon className="w-12 h-12 mx-auto" />
                               <p className="font-semibold mt-2">Haga clic para seleccionar una imagen, video o PDF</p>
                               <p className="text-xs text-slate-400 mt-1">El archivo se analizará para identificar riesgos.</p>
                               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*,application/pdf" className="hidden" />
                           </button>
                        )}
                        {sourceType === 'camera' && isCameraOn && !media && (
                             <div className="w-full text-center">
                                 <video ref={videoRef} autoPlay playsInline className="w-full rounded-md shadow-inner" />
                                 <Button onClick={captureFrame} className="mt-4">Capturar Imagen</Button>
                             </div>
                        )}
                        {media && (
                            <div className="text-center">
                                {media.type.startsWith('image/') && (
                                    <img src={`data:${media.type};base64,${media.data}`} alt="Vista previa" className="max-h-64 rounded-md shadow-md mx-auto" />
                                )}
                                {media.type.startsWith('video/') && (
                                    <video src={`data:${media.type};base64,${media.data}`} controls className="max-h-64 rounded-md shadow-md mx-auto" />
                                )}
                                {media.type === 'application/pdf' && (
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-200 rounded-md">
                                        <DocumentTextIcon className="w-16 h-16 text-slate-500" />
                                        <p className="mt-2 text-sm font-semibold text-slate-700 break-all">{media.name}</p>
                                    </div>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => { setMedia(null); setAnalysisResult(null); if(sourceType==='camera') startCamera(); }} className="mt-2">
                                  <ArrowPathIcon className="w-4 h-4 mr-1" />  Cambiar
                                </Button>
                            </div>
                        )}
                    </div>

                    <h3 className="font-semibold text-lg text-slate-700">2. Describa el Análisis</h3>
                    <TextArea
                        label="¿Qué tarea o proceso se está realizando o describiendo en el archivo?"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={3}
                        placeholder="Ej: 'Analizar los riesgos en la tarea de despostillado que se ve en el video.' o 'Evaluar los riesgos descritos en este informe de incidente PDF.'"
                        disabled={!media}
                    />

                    <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!media || !prompt || isLoading} className="w-full">
                        <SparklesIcon className="w-5 h-5 mr-2"/>
                        Analizar con IA
                    </Button>
                </div>
                
                {/* Right Column: Output */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-slate-700">3. Resultado del Análisis de "Segurito"</h3>
                    <div className="p-4 bg-slate-50 rounded-lg min-h-[400px] prose-sm max-w-none overflow-y-auto">
                        {isLoading && <p className="text-slate-500 animate-pulse">Analizando archivo y generando matriz IPERC, por favor espere...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {analysisResult && (
                            <div className="space-y-4">
                               <h4 className="font-bold text-slate-800">Riesgos Identificados ({analysisResult.riskItems?.length || 0}):</h4>
                                {analysisResult.riskItems?.map(risk => (
                                    <div key={risk.item} className="p-3 bg-white rounded-md border">
                                        <p><strong>Riesgo:</strong> {risk.riesgo}</p>
                                        <p><strong>Clasificación Inicial:</strong> <span className={`font-semibold ${
                                            risk.clasificacionRiesgoInicial === 'ALTO' ? 'text-red-600' :
                                            risk.clasificacionRiesgoInicial === 'MEDIO' ? 'text-amber-600' : 'text-blue-600'
                                        }`}>{risk.clasificacionRiesgoInicial}</span></p>
                                        <p><strong>Acción Propuesta:</strong> {risk.accionesRequeridas}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!analysisResult && !isLoading && !error && <p className="text-slate-400">La vista previa de la matriz de riesgos aparecerá aquí.</p>}
                    </div>
                    {analysisResult && (
                        <Button onClick={handleSave} className="w-full">
                            Guardar en Historial de Evaluaciones
                        </Button>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </Card>
    );
};

export default SeguritoVision;