import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Attachment, RiskMarker } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import { TrashIcon, DownloadIcon, AiVisionIcon, ArrowPathIcon, TableIcon, SparklesIcon, ImageIcon, CropIcon, ShieldCheckIcon, PrintIcon } from './IconComponents';
import { swiftLogoBase64 } from '../assets/logo';

// Comprehensive ISO 7010 / IRAM Normalized Catalog
const HAZARD_ICONS = [
    // --- ADVERTENCIA (Triángulos Amarillos - ISO 7010-W) ---
    { id: 'w_peligro', category: 'Riesgo', label: 'PELIGRO GENERAL', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z', color: '#F59E0B' },
    { id: 'w_electrico', category: 'Riesgo', label: 'ELECTROCUCIÓN', path: 'M7,2V13H10V22L17,10H13L17,2H7Z', color: '#F59E0B' },
    { id: 'w_frio', category: 'Riesgo', label: 'FRÍO EXTREMO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M12,10L11,12H13L12,10M11,14V16H13V14H11M11,17V18H13V17H11Z', color: '#F59E0B' },
    { id: 'w_calor', category: 'Riesgo', label: 'SUPERF. CALIENTE', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M7,17V15H8V17H7M10,17V13H11V17H10M13,17V11H14V17H13M16,17V14H17V17H16Z', color: '#F59E0B' },
    { id: 'w_bio', category: 'Riesgo', label: 'RIESGO BIOLÓGICO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17Z', color: '#F59E0B' },
    { id: 'w_corrosivo', category: 'Riesgo', label: 'PROD. CORROSIVO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M8,14H16V16H8V14M8,10H10V12H8V10M14,10H16V12H14V10Z', color: '#F59E0B' },
    { id: 'w_explocion', category: 'Riesgo', label: 'RIESGO EXPLOSIÓN', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M12,10L10,13H14L12,16L15,13H11L13,10H12Z', color: '#F59E0B' },
    { id: 'w_atrapamiento', category: 'Riesgo', label: 'ATRAPAMIENTO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10H13V12H11V10M10,13H14V15H10V13M9,16H15V18H9V16Z', color: '#F59E0B' },
    { id: 'w_aplastamiento', category: 'Riesgo', label: 'APLASTAMIENTO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M8,10H16V12H8V10M8,16H16V18H8V16Z', color: '#F59E0B' },
    { id: 'w_caida_nivel', category: 'Riesgo', label: 'CAÍDA A NIVEL', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M7,18L10,15L13,18H7Z', color: '#F59E0B' },
    { id: 'w_caida_altura', category: 'Riesgo', label: 'CAÍDA ALTURA', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10H13V15H15L12,18L9,15H11V10Z', color: '#F59E0B' },
    { id: 'w_cortes', category: 'Riesgo', label: 'CORTES/PUNCIONES', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,9L13,12L11,15L13,18H11L9,15L11,12L9,9H11Z', color: '#F59E0B' },
    { id: 'w_carga', category: 'Riesgo', label: 'CARGA SUSPENDIDA', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10H13V13H11V10M9,14H15V16H9V14M11,17H13V18H11V17Z', color: '#F59E0B' },
    { id: 'w_montacargas', category: 'Riesgo', label: 'TRANSITO AUTOELEV.', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M9,12H15V14H13V16H11V14H9V12M10,17H14V18H10V17Z', color: '#F59E0B' },

    // --- OBLIGACIÓN (Círculos Azules - ISO 7010-M) ---
    { id: 'm_gafas', category: 'Obligación', label: 'PROT. OCULAR', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,10H17V12H15V14H9V12H7V10Z', color: '#3B82F6' },
    { id: 'm_auditiva', category: 'Obligación', label: 'PROT. AUDITIVA', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M9,9V15H11L13,17V7L11,9H9Z', color: '#3B82F6' },
    { id: 'm_casco', category: 'Obligación', label: 'USO DE CASCO', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,7A5,5 0 0,0 7,12H17A5,5 0 0,0 12,7Z', color: '#3B82F6' },
    { id: 'm_guantes', category: 'Obligación', label: 'USO DE GUANTES', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M10,8V16H14V8H10Z', color: '#3B82F6' },
    { id: 'm_botas', category: 'Obligación', label: 'USO DE CALZADO', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M9,17H15V14H9V17Z', color: '#3B82F6' },
    { id: 'm_arnes', category: 'Obligación', label: 'USO DE ARNÉS', path: 'M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,7V17H13V7H11Z', color: '#3B82F6' },

    // --- SALVAMENTO (Cuadrados Verdes - ISO 7010-E) ---
    { id: 'e_botiquin', category: 'Salvamento', label: 'PRIMEROS AUX.', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M11,7H13V11H17V13H13V17H11V13H7V11H11V7Z', color: '#10B981' },
    { id: 'e_salida', category: 'Salvamento', label: 'SALIDA EMERG.', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M15,10L18,12L15,14V13H8V11H15V10Z', color: '#10B981' },
    { id: 'e_ducha', category: 'Salvamento', label: 'DUCHA EMERG.', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7M10,12H14V17H10V12Z', color: '#10B981' },
    { id: 'e_lavaojos', category: 'Salvamento', label: 'LAVAOJOS', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M7,10H17V12H7V10M12,13L10,17H14L12,13Z', color: '#10B981' },

    // --- INCENDIO (Cuadrados Rojos - ISO 7010-F) ---
    { id: 'f_extintor', category: 'Incendio', label: 'MATAFUEGO', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M10,7H14V17H10V7M15,9V15H17V9H15Z', color: '#EF4444' },
    { id: 'f_hidrante', category: 'Incendio', label: 'HIDRANTE', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M12,7A3,3 0 0,1 15,10A3,3 0 0,1 12,13A3,3 0 0,1 9,10A3,3 0 0,1 12,7M11,14H13V18H11V14Z', color: '#EF4444' },
    { id: 'f_alarma', category: 'Incendio', label: 'PULSADOR ALARMA', path: 'M3,3V21H21V3H3M19,19H5V5H19V19M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z', color: '#EF4444' },
    { id: 'e_aqui', category: 'Salvamento', label: 'USTED ESTÁ AQUÍ', path: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z', color: '#EF4444' },
    { id: 'e_punto', category: 'Salvamento', label: 'PTO. ENCUENTRO', path: 'M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z', color: '#10B981' },
];

interface RiskMapEditorProps {
    source: Attachment;
    sector: string;
    onExport: (dataUrl: string) => void;
}

const RESOLUTION_SCALE = 4;

const RiskMapEditor: React.FC<RiskMapEditorProps> = ({ source, sector, onExport }) => {
    const [markers, setMarkers] = useState<RiskMarker[]>([]);
    const [history, setHistory] = useState<RiskMarker[][]>([]);
    const [selectedType, setSelectedType] = useState<RiskMarker['type']>('high');
    const [selectedIconId, setSelectedIconId] = useState<string | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<string>('Riesgo');
    const [zoom, setZoom] = useState(1);
    const [markerScale, setMarkerScale] = useState(1.5);
    const [customColor, setCustomColor] = useState<string>('');
    const [imageScale, setImageScale] = useState(1.0);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const [tool, setTool] = useState<'marker' | 'pan' | 'crop'>('marker');
    const [cropRect, setCropRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const cropStartPos = useRef<{ x: number, y: number } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const lastMousePos = useRef<{ x: number, y: number } | null>(null);

    const handleFitToView = useCallback(() => {
        if (!canvasRef.current || !containerRef.current || !imageRef.current) return;
        const container = containerRef.current;
        const img = imageRef.current;
        
        const canvasWidth = img.naturalWidth * imageScale;
        const canvasHeight = img.naturalHeight * imageScale;
        
        const scaleX = (container.clientWidth - 60) / canvasWidth;
        const scaleY = (container.clientHeight - 60) / canvasHeight;
        
        const newZoom = Math.min(scaleX, scaleY, 1.5);
        setZoom(newZoom);
        setPanX(0);
        setPanY(0);
    }, [imageScale]);

    const handleFitToPrint = useCallback(() => {
        handleFitToView();
    }, [handleFitToView]);

    const iconPaths = useMemo(() => {
        const map: Record<string, Path2D> = {};
        HAZARD_ICONS.forEach(icon => {
            map[icon.id] = new Path2D(icon.path);
        });
        return map;
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = `data:${source.type};base64,${source.data}`;
        img.onload = () => {
            imageRef.current = img;
            renderCanvas();
        };
    }, [source]);

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const img = imageRef.current;
        // Use high resolution scale and base image scale
        canvas.width = img.naturalWidth * RESOLUTION_SCALE * imageScale;
        canvas.height = img.naturalHeight * RESOLUTION_SCALE * imageScale;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background image with pan
        ctx.drawImage(
            img, 
            panX * RESOLUTION_SCALE, 
            panY * RESOLUTION_SCALE, 
            img.naturalWidth * RESOLUTION_SCALE * imageScale, 
            img.naturalHeight * RESOLUTION_SCALE * imageScale
        );

        markers.forEach(marker => {
            const iconConfig = HAZARD_ICONS.find(i => i.id === marker.icon);
            const color = marker.color || iconConfig?.color || (marker.type === 'high' ? '#EF4444' : marker.type === 'medium' ? '#F59E0B' : '#3B82F6');
            
            ctx.save();
            // Scale markers to the high resolution and image scale, plus pan
            const renderX = (marker.x * imageScale + panX) * RESOLUTION_SCALE;
            const renderY = (marker.y * imageScale + panY) * RESOLUTION_SCALE;
            
            ctx.translate(renderX, renderY);
            
            // Adjust marker base size for high res and user scale
            const baseSize = 26 * RESOLUTION_SCALE * (marker.scale || markerScale);
            
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 12 * RESOLUTION_SCALE;
            ctx.shadowOffsetY = 6 * RESOLUTION_SCALE;

            ctx.beginPath();
            ctx.arc(0, 0, baseSize, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3.5 * RESOLUTION_SCALE;
            ctx.stroke();

            if (marker.icon && iconPaths[marker.icon]) {
                ctx.save();
                // Scale icon path
                const iconScale = RESOLUTION_SCALE * 1.5 * (marker.scale || markerScale);
                ctx.scale(iconScale, iconScale);
                ctx.translate(-12, -12);
                ctx.fillStyle = 'white';
                ctx.fill(iconPaths[marker.icon]);
                ctx.restore();
                
                ctx.fillStyle = 'white';
                ctx.font = `bold ${12 * RESOLUTION_SCALE * (marker.scale || markerScale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(marker.id.toString(), 16 * RESOLUTION_SCALE * (marker.scale || markerScale), 16 * RESOLUTION_SCALE * (marker.scale || markerScale));

                // ADD LEGEND TEXT ON CANVAS FOR SPECIAL ICONS
                if (marker.icon === 'e_aqui' || marker.icon === 'e_punto') {
                    ctx.save();
                    const labelText = marker.icon === 'e_aqui' ? 'USTED ESTÁ AQUÍ' : 'PUNTO DE ENCUENTRO';
                    const fontSize = 12 * RESOLUTION_SCALE * (marker.scale || markerScale);
                    ctx.font = `bold ${fontSize}px Arial`;
                    const textWidth = ctx.measureText(labelText).width;
                    const padding = 6 * RESOLUTION_SCALE * (marker.scale || markerScale);
                    
                    // Position text above the icon
                    const textY = -40 * RESOLUTION_SCALE * (marker.scale || markerScale);
                    
                    // Draw background bubble
                    ctx.fillStyle = marker.icon === 'e_aqui' ? '#EF4444' : '#10B981';
                    
                    const x = -textWidth/2 - padding;
                    const y = textY - fontSize - padding;
                    const w = textWidth + padding * 2;
                    const h = fontSize + padding * 2;
                    
                    // Simple rounded rect
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, 4 * RESOLUTION_SCALE);
                    ctx.fill();
                    
                    // Draw pointer triangle
                    ctx.beginPath();
                    ctx.moveTo(-5 * RESOLUTION_SCALE, y + h);
                    ctx.lineTo(5 * RESOLUTION_SCALE, y + h);
                    ctx.lineTo(0, y + h + 5 * RESOLUTION_SCALE);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw text
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(labelText, 0, y + h/2 + 1);
                    ctx.restore();
                }
            } else {
                ctx.fillStyle = 'white';
                ctx.font = `bold ${24 * RESOLUTION_SCALE * (marker.scale || markerScale)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(marker.id.toString(), 0, 0);
            }
            ctx.restore();
        });

        if (cropRect && tool === 'crop') {
            const cX = (cropRect.x * imageScale + panX) * RESOLUTION_SCALE;
            const cY = (cropRect.y * imageScale + panY) * RESOLUTION_SCALE;
            const cW = cropRect.width * imageScale * RESOLUTION_SCALE;
            const cH = cropRect.height * imageScale * RESOLUTION_SCALE;

            ctx.save();
            ctx.strokeStyle = '#E11D48';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(cX, cY, cW, cH);
            ctx.fillStyle = 'rgba(225, 29, 72, 0.1)';
            ctx.fillRect(cX, cY, cW, cH);
            ctx.restore();
        }
    }, [markers, iconPaths, imageScale, markerScale, panX, panY, cropRect, tool]);

    useEffect(() => { renderCanvas(); }, [renderCanvas]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'pan') {
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        } else if (tool === 'crop') {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const visualX = (e.clientX - rect.left) * (canvas.width / rect.width) / RESOLUTION_SCALE;
            const visualY = (e.clientY - rect.top) * (canvas.height / rect.height) / RESOLUTION_SCALE;
            const x = (visualX - panX) / imageScale;
            const y = (visualY - panY) / imageScale;
            
            cropStartPos.current = { x, y };
            setCropRect({ x, y, width: 0, height: 0 });
            setIsCropping(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && lastMousePos.current) {
            const dx = (e.clientX - lastMousePos.current.x) / zoom;
            const dy = (e.clientY - lastMousePos.current.y) / zoom;
            
            setPanX(prev => prev + dx);
            setPanY(prev => prev + dy);
            
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        } else if (isCropping && cropStartPos.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const visualX = (e.clientX - rect.left) * (canvas.width / rect.width) / RESOLUTION_SCALE;
            const visualY = (e.clientY - rect.top) * (canvas.height / rect.height) / RESOLUTION_SCALE;
            const x = (visualX - panX) / imageScale;
            const y = (visualY - panY) / imageScale;
            
            setCropRect({
                x: Math.min(x, cropStartPos.current.x),
                y: Math.min(y, cropStartPos.current.y),
                width: Math.abs(x - cropStartPos.current.x),
                height: Math.abs(y - cropStartPos.current.y)
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setIsCropping(false);
        lastMousePos.current = null;
        cropStartPos.current = null;
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'pan' || tool === 'crop') return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate coordinates relative to the original image size, accounting for pan and scale
        const visualX = (e.clientX - rect.left) * (canvas.width / rect.width) / RESOLUTION_SCALE;
        const visualY = (e.clientY - rect.top) * (canvas.height / rect.height) / RESOLUTION_SCALE;
        
        const x = (visualX - panX) / imageScale;
        const y = (visualY - panY) / imageScale;

        const iconLabel = HAZARD_ICONS.find(i => i.id === selectedIconId)?.label;
        const newMarker: RiskMarker = {
            id: markers.length + 1,
            x, y,
            type: selectedType,
            label: iconLabel || 'Punto de Seguridad',
            icon: selectedIconId,
            color: customColor || undefined,
            scale: markerScale
        };
        setHistory([...history, markers]);
        setMarkers([...markers, newMarker]);
    };

    const handleUndo = () => {
        if (history.length > 0) {
            setMarkers(history[history.length - 1]);
            setHistory(history.slice(0, -1));
        }
    };

    const updateMarkerLabel = (id: number, label: string) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, label } : m));
    };

    const updateMarkerColor = (id: number, color: string) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, color } : m));
    };

    const updateMarkerScale = (id: number, scale: number) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, scale } : m));
    };

    const removeMarker = (id: number) => {
        setHistory([...history, markers]);
        setMarkers(markers.filter(m => m.id !== id).map((m, idx) => ({ ...m, id: idx + 1 })));
    };

    const generateProfessionalCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        const finalCanvas = document.createElement('canvas');
        
        // Professional Print Dimensions (A4 at 300 DPI)
        const A4_W = 3508;
        const A4_H = 2480;
        
        let exportWidth = A4_W;
        let exportHeight = A4_H;
        
        finalCanvas.width = exportWidth;
        finalCanvas.height = exportHeight;
        
        const fctx = finalCanvas.getContext('2d', { alpha: false });
        if (!fctx) return null;

        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';

        fctx.fillStyle = 'white';
        fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        const padding = exportWidth * 0.03;
        const headerHeight = exportHeight * 0.12;
        
        // Border
        fctx.strokeStyle = '#002A50';
        fctx.lineWidth = exportWidth * 0.003;
        fctx.strokeRect(padding / 2, padding / 2, finalCanvas.width - padding, finalCanvas.height - padding);

        // Header
        fctx.fillStyle = '#002A50';
        fctx.fillRect(padding, padding, finalCanvas.width - (padding * 2), headerHeight);
        
        const logoImg = new Image();
        logoImg.src = swiftLogoBase64;
        const logoSize = headerHeight * 0.7;
        fctx.drawImage(logoImg, padding + 40, padding + (headerHeight - logoSize) / 2, logoSize, logoSize);
        
        fctx.fillStyle = 'white';
        fctx.textBaseline = 'middle';
        fctx.font = `bold ${headerHeight * 0.25}px Arial`;
        fctx.fillText('MAPA INTEGRAL DE RIESGOS (ISO 7010)', padding + logoSize + 80, padding + headerHeight * 0.40);
        fctx.font = `${headerHeight * 0.15}px Arial`;
        fctx.fillText(`SECTOR: ${sector.toUpperCase()} - PLANTA INDUSTRIAL`, padding + logoSize + 80, padding + headerHeight * 0.70);
        
        // Reset baseline
        fctx.textBaseline = 'alphabetic';

        // Calculate Plan Area vs Legend Area
        const legendWidth = exportWidth * 0.25;
        const planAreaWidth = exportWidth - (padding * 3) - legendWidth;
        const planAreaHeight = exportHeight - (padding * 3) - headerHeight;
        
        // Use crop area if defined, otherwise use full canvas
        const sourceX = (cropRect ? cropRect.x * imageScale + panX : 0) * RESOLUTION_SCALE;
        const sourceY = (cropRect ? cropRect.y * imageScale + panY : 0) * RESOLUTION_SCALE;
        const sourceW = (cropRect ? cropRect.width * imageScale : canvas.width / RESOLUTION_SCALE) * RESOLUTION_SCALE;
        const sourceH = (cropRect ? cropRect.height * imageScale : canvas.height / RESOLUTION_SCALE) * RESOLUTION_SCALE;

        const scaleX = planAreaWidth / (sourceW / RESOLUTION_SCALE);
        const scaleY = planAreaHeight / (sourceH / RESOLUTION_SCALE);
        const planScale = Math.min(scaleX, scaleY);
        
        const drawW = (sourceW / RESOLUTION_SCALE) * planScale;
        const drawH = (sourceH / RESOLUTION_SCALE) * planScale;
        const drawX = padding + (planAreaWidth - drawW) / 2;
        const drawY = padding + headerHeight + padding + (planAreaHeight - drawH) / 2;

        fctx.drawImage(canvas, sourceX, sourceY, sourceW, sourceH, drawX, drawY, drawW, drawH);
        
        // Border around plan
        fctx.strokeStyle = '#CBD5E1';
        fctx.lineWidth = 2;
        fctx.strokeRect(drawX, drawY, drawW, drawH);

        // Legend
        const legendX = padding + planAreaWidth + padding;
        let currentY = padding + headerHeight + padding + 50;
        
        fctx.fillStyle = '#002A50';
        fctx.font = `bold ${exportWidth * 0.018}px Arial`;
        fctx.fillText('LEYENDA DE SEGURIDAD', legendX, currentY);
        currentY += exportHeight * 0.05;

        const usedIconIds = Array.from(new Set(markers.map(m => m.icon)));
        const legendIcons = HAZARD_ICONS.filter(icon => usedIconIds.includes(icon.id));

        // Use two columns for legend if many icons
        const useTwoCols = legendIcons.length > 15;
        const colWidth = legendWidth / 2;

        legendIcons.forEach((icon, i) => {
            if (currentY > exportHeight - padding) return;

            const col = useTwoCols ? (i % 2) : 0;
            const xOffset = col * colWidth;
            const drawX = legendX + xOffset;

            const color = icon.color || '#3B82F6';
            const iconSize = exportWidth * 0.012;
            
            fctx.beginPath();
            fctx.arc(drawX + iconSize, currentY, iconSize, 0, 2 * Math.PI);
            fctx.fillStyle = color;
            fctx.fill();
            fctx.strokeStyle = 'white';
            fctx.lineWidth = 2;
            fctx.stroke();

            if (icon.id && iconPaths[icon.id]) {
                fctx.save();
                fctx.translate(drawX + iconSize - (iconSize * 0.6), currentY - (iconSize * 0.6));
                fctx.scale(iconSize * 0.05, iconSize * 0.05);
                fctx.fillStyle = 'white';
                fctx.fill(iconPaths[icon.id]);
                fctx.restore();
            }
            
            fctx.fillStyle = '#1E293B';
            fctx.font = `bold ${exportWidth * 0.01}px Arial`;
            fctx.fillText(icon.label.toUpperCase(), drawX + iconSize * 2.5, currentY + iconSize * 0.3);
            
            if (!useTwoCols || i % 2 === 1) {
                currentY += exportHeight * 0.035;
            }
        });

        return finalCanvas;
    };

    const handleDownload = () => {
        const finalCanvas = generateProfessionalCanvas();
        if (!finalCanvas) return;
        const dataUrl = finalCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `MAPA_RIESGOS_PROFESIONAL_${sector.toUpperCase()}.png`;
        link.href = dataUrl;
        link.click();
    };

    const handleExportPDF = () => {
        const finalCanvas = generateProfessionalCanvas();
        if (!finalCanvas) return;

        // Use PNG for ultra quality (lossless)
        const imgData = finalCanvas.toDataURL('image/png');
        const orientation = finalCanvas.width > finalCanvas.height ? 'l' : 'p';
        
        // Create PDF with exact canvas dimensions
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'px',
            format: [finalCanvas.width, finalCanvas.height],
            hotfixes: ['px_scaling']
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, finalCanvas.width, finalCanvas.height, undefined, 'FAST');
        pdf.save(`MAPA_RIESGOS_PROFESIONAL_${sector.toUpperCase()}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    const categories = ['Riesgo', 'Obligación', 'Salvamento', 'Incendio'];
    const usedIcons = Array.from(new Set(markers.map(m => m.icon)));

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)] lg:overflow-hidden">
            {/* Hidden Print Layout */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-visible">
                <div className="border-[12px] border-[#002A50] h-full flex flex-col">
                    <div className="bg-[#002A50] text-white p-8 text-center flex flex-col items-center justify-center border-b-[6px] border-white/10 relative overflow-hidden">
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20">
                            <img src={swiftLogoBase64} className="h-24 w-auto brightness-0 invert" alt="Logo Watermark" />
                        </div>
                        <div className="mb-4 relative z-10">
                            <ShieldCheckIcon className="h-16 w-16 text-brand-accent mx-auto" />
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none relative z-10">Mapa Integral de Riesgos</h1>
                        <div className="mt-4 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 relative z-10">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">SECTOR: {sector.toUpperCase()}</h2>
                        </div>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                            <img src={swiftLogoBase64} className="h-24 w-auto brightness-0 invert" alt="Logo Watermark" />
                        </div>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center p-4 min-h-0">
                        <img 
                            src={canvasRef.current?.toDataURL()} 
                            className="max-w-full max-h-full object-contain border shadow-sm"
                            alt="Plano"
                        />
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <h3 className="font-bold text-xl mb-4 text-[#002A50]">LEYENDA DE SEGURIDAD (ISO 7010)</h3>
                        <div className="grid grid-cols-4 gap-y-4 gap-x-8">
                            {usedIcons.map(iconId => {
                                const icon = HAZARD_ICONS.find(i => i.id === iconId);
                                return (
                                    <div key={iconId} className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" style={{ color: icon?.color }}>
                                                <path d={icon?.path} />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-700 uppercase">{icon?.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#002A50] text-white p-4 flex justify-between items-center">
                        <p className="text-xl font-black">SEGURIDAD Y SALUD OCUPACIONAL</p>
                        <img src={swiftLogoBase64} className="h-12 w-auto brightness-0 invert" alt="Logo" />
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-row print:hidden lg:h-full overflow-hidden bg-slate-50">
                {/* Vertical Side Toolbar */}
                <div className="w-16 md:w-20 bg-white border-r flex flex-col items-center py-4 gap-6 flex-shrink-0 z-40 shadow-xl overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col gap-2 w-full px-2">
                        <button 
                            onClick={() => setTool('marker')}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'marker' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Marcadores"
                        >
                            <SparklesIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Marcas</span>
                        </button>
                        <button 
                            onClick={() => setTool('pan')}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'pan' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Mover"
                        >
                            <ArrowPathIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Mover</span>
                        </button>
                        <button 
                            onClick={() => setTool('crop')}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${tool === 'crop' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Recortar"
                        >
                            <CropIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Corte</span>
                        </button>
                    </div>

                    <div className="w-10 h-px bg-slate-100"></div>

                    <div className="flex flex-col gap-2 w-full px-2">
                        <button 
                            onClick={handleUndo} 
                            disabled={history.length === 0}
                            className="p-3 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 transition-all flex flex-col items-center gap-1"
                            title="Deshacer"
                        >
                            <ArrowPathIcon className="w-6 h-6 transform rotate-180" />
                            <span className="text-[8px] font-black uppercase">Atrás</span>
                        </button>
                        <button 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${showAdvanced ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="Ajustes"
                        >
                            <TableIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Ajustes</span>
                        </button>
                    </div>

                    <div className="mt-auto flex flex-col gap-2 w-full px-2">
                        <button 
                            onClick={handlePrint}
                            className="p-3 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex flex-col items-center gap-1"
                            title="Imprimir"
                        >
                            <PrintIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Print</span>
                        </button>
                        <button 
                            onClick={handleExportPDF}
                            className="p-3 rounded-xl bg-brand-primary text-white shadow-lg hover:bg-brand-primary/90 transition-all flex flex-col items-center gap-1"
                            title="Exportar PDF"
                        >
                            <DownloadIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col overflow-hidden relative">
                    {showAdvanced && (
                        <div className="absolute top-4 left-4 right-4 z-50 bg-white/95 backdrop-blur-md p-4 rounded-2xl border shadow-2xl flex flex-wrap gap-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zoom Vista:</span>
                                <input type="range" min="0.1" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Escala Plano:</span>
                                <input type="range" min="0.5" max="2" step="0.1" value={imageScale} onChange={(e) => setImageScale(parseFloat(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                <span className="text-[10px] font-mono font-bold text-brand-primary">{imageScale.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tamaño Iconos:</span>
                                <input type="range" min="0.5" max="3" step="0.1" value={markerScale} onChange={(e) => setMarkerScale(parseFloat(e.target.value))} className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                <span className="text-[10px] font-mono font-bold text-brand-primary">{markerScale.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button size="xs" variant="secondary" onClick={handleFitToView}>
                                    <AiVisionIcon className="w-3 h-3 mr-1" /> Ajustar
                                </Button>
                                <Button size="xs" variant="secondary" onClick={() => { setPanX(0); setPanY(0); }}>
                                    <ArrowPathIcon className="w-3 h-3 mr-1" /> Reset
                                </Button>
                                <Button size="xs" variant="primary" onClick={() => setShowAdvanced(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-grow flex flex-col overflow-hidden">
                        {cropRect && (
                            <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between z-30">
                                <div className="flex items-center gap-2">
                                    <CropIcon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Área de Recorte Activa</span>
                                </div>
                                <button onClick={() => setCropRect(null)} className="text-[10px] font-bold underline">ELIMINAR</button>
                            </div>
                        )}

                        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                            <div className="flex-grow flex flex-col overflow-hidden">
                                {/* Icon Selector - Now a compact top bar or side-scrollable */}
                                <div className="bg-white border-b p-2 flex-shrink-0 z-20 shadow-sm">
                                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-1 px-2">
                                        {categories.map(cat => (
                                            <button 
                                                key={cat} 
                                                onClick={() => { setActiveTab(cat); setTool('marker'); }} 
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap border ${activeTab === cat ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                {cat.toUpperCase()}
                                            </button>
                                        ))}
                                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                        <div className="flex gap-2">
                                            {HAZARD_ICONS.filter(i => i.category === activeTab).map(icon => (
                                                <button 
                                                    key={icon.id} 
                                                    onClick={() => { setSelectedIconId(icon.id); setTool('marker'); }} 
                                                    className={`w-10 h-10 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all ${selectedIconId === icon.id ? 'bg-brand-primary text-white border-brand-primary shadow-lg scale-110' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'}`}
                                                    title={icon.label}
                                                >
                                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d={icon.path} /></svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Canvas Area - Maximized */}
                                <div 
                                    ref={containerRef} 
                                    className={`relative bg-slate-900 flex-grow overflow-hidden flex items-center justify-center ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}`} 
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    <canvas 
                                        ref={canvasRef} 
                                        onClick={handleCanvasClick} 
                                        className={`${tool === 'marker' ? 'cursor-crosshair' : ''} shadow-2xl transition-shadow bg-white`} 
                                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} 
                                    />
                                    
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-2xl pointer-events-none">
                                        {tool === 'marker' ? 'Modo Diseño' : tool === 'pan' ? 'Modo Movimiento' : 'Modo Recorte'}
                                    </div>

                                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                        <div className="bg-black/70 text-white px-3 py-1 rounded-lg text-[9px] font-bold backdrop-blur-sm border border-white/10 shadow-xl">
                                            ZOOM: {(zoom * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* References Sidebar - Now more compact and scrollable */}
                            <div className="w-full md:w-80 bg-white border-l flex flex-col flex-shrink-0 overflow-hidden">
                                <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                                    <h3 className="font-black text-slate-700 text-xs flex items-center uppercase tracking-wider">
                                        <AiVisionIcon className="w-4 h-4 mr-2 text-brand-primary" /> Referencias ({markers.length})
                                    </h3>
                                </div>
                                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {markers.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 italic text-xs">
                                            Toca el plano para marcar riesgos.
                                        </div>
                                    ) : (
                                        markers.map(m => (
                                            <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group relative hover:border-brand-primary/30 transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-[9px] shadow-sm" style={{ backgroundColor: m.color || HAZARD_ICONS.find(i => i.id === m.icon)?.color || '#94a3b8' }}>
                                                        {m.icon ? <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d={HAZARD_ICONS.find(i => i.id === m.icon)?.path} /></svg> : m.id}
                                                    </span>
                                                    <div className="flex flex-col flex-1 truncate">
                                                        <span className="text-[10px] font-bold text-slate-600 truncate">{m.label || `Marca #${m.id}`}</span>
                                                    </div>
                                                    <button onClick={() => removeMarker(m.id)} className="text-slate-300 hover:text-red-500 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <Input label="" value={m.label} onChange={(e) => updateMarkerLabel(m.id, e.target.value)} placeholder="Descripción..." className="!mt-0 !h-7 text-[10px]" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskMapEditor;