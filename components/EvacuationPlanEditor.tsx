import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Attachment, RiskMarker } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import { TrashIcon, DownloadIcon, AiVisionIcon, ArrowPathIcon, SparklesIcon, TableIcon, ImageIcon, CropIcon, ShieldCheckIcon } from './IconComponents';
import { swiftLogoBase64 } from '../assets/logo';

const EVAC_ICONS = [
    // EVACUACIÓN PRINCIPAL (Sólidas)
    { id: 'e_ruta_p_r', category: 'Evacuación', label: 'RUTA PRINC. →', path: 'M3,11h14.17l-3.59-3.59L15,6l6,6-6,6-1.41-1.42L17.17,13H3V11z', color: '#10B981', isArrow: true },
    { id: 'e_ruta_p_l', category: 'Evacuación', label: 'RUTA PRINC. ←', path: 'M21,11H6.83L10.41,7.41L9,6L3,12L9,18L10.41,16.58L6.83,13H21V11Z', color: '#10B981', isArrow: true },
    { id: 'e_ruta_p_u', category: 'Evacuación', label: 'RUTA PRINC. ↑', path: 'M13,21V6.83l3.59,3.59L18,9l-6-6L6,9l1.41,1.41L11,6.83V21H13z', color: '#10B981', isArrow: true },
    { id: 'e_ruta_p_d', category: 'Evacuación', label: 'RUTA PRINC. ↓', path: 'M11,3v14.17l-3.59-3.59L6,15l6,6l6-6l-1.41-1.41L13,17.17V3H11z', color: '#10B981', isArrow: true },
    
    // EVACUACIÓN ALTERNATIVA (Contornos)
    { id: 'e_ruta_a_r', category: 'Evacuación', label: 'RUTA ALT. →', path: 'M3,11h14.17l-3.59-3.59L15,6l6,6-6,6-1.41-1.42L17.17,13H3V11z', color: '#10B981', isOutline: true },
    { id: 'e_ruta_a_l', category: 'Evacuación', label: 'RUTA ALT. ←', path: 'M21,11H6.83L10.41,7.41L9,6L3,12L9,18L10.41,16.58L6.83,13H21V11Z', color: '#10B981', isOutline: true },
    { id: 'e_ruta_a_u', category: 'Evacuación', label: 'RUTA ALT. ↑', path: 'M13,21V6.83l3.59,3.59L18,9l-6-6L6,9l1.41,1.41L11,6.83V21H13z', color: '#10B981', isOutline: true },
    { id: 'e_ruta_a_d', category: 'Evacuación', label: 'RUTA ALT. ↓', path: 'M11,3v14.17l-3.59-3.59L6,15l6,6l6-6l-1.41-1.41L13,17.17V3H11z', color: '#10B981', isOutline: true },

    // EQUIPAMIENTO FIJO
    { id: 'e_salida_r', category: 'Equipos', label: 'SALIDA DER.', path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14h-2v-4h-4v4h-2V7h10v10z', color: '#10B981' },
    { id: 'e_salida_l', category: 'Equipos', label: 'SALIDA IZQ.', path: 'M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm1 14h2v-4h4v4h2V7H5v10z', color: '#10B981' },
    { id: 'e_punto', category: 'Equipos', label: 'PTO. ENCUENTRO', path: 'M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z', color: '#10B981' }, 
    { id: 'e_aqui', category: 'Equipos', label: 'ESTÁ AQUÍ', path: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z', color: '#EF4444' },

    // INCENDIO Y SEGURIDAD
    { id: 'f_extintor', category: 'Incendio', label: 'EXTINTOR', path: 'M18 16.22V8h-2V4h-2v4h-4V4H8v4H6v8.22c-1.18.42-2 1.54-2 2.85v15.86c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V19.07c0-1.31-.82-2.43-2-2.85z', color: '#EF4444' },
    { id: 'f_hidrante', category: 'Incendio', label: 'HIDRANTE', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z', color: '#EF4444' },
    { id: 'f_alarma', category: 'Incendio', label: 'ALARMA INCENDIO', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z', color: '#EF4444' },
    { id: 'f_pulsador', category: 'Incendio', label: 'PULSADOR EMERG.', path: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7Z', color: '#EF4444' },
    { id: 'e_luz_emerg', category: 'Equipos', label: 'LUZ EMERG.', path: 'M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z', color: '#F59E0B' },
    { id: 'e_tablero', category: 'Equipos', label: 'TABLERO ELÉC.', path: 'M7,2V13H10V22L17,10H13L17,2H7Z', color: '#3B82F6' },
    { id: 'e_gas', category: 'Equipos', label: 'CORTE GAS', path: 'M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z', color: '#F59E0B' },
];

interface EvacuationPlanEditorProps {
    source: Attachment;
    sector: string;
    onExport: (dataUrl: string) => void;
}

const RESOLUTION_SCALE = 4;

const EvacuationPlanEditor: React.FC<EvacuationPlanEditorProps> = ({ source, sector, onExport }) => {
    const [markers, setMarkers] = useState<RiskMarker[]>([]);
    const [history, setHistory] = useState<RiskMarker[][]>([]);
    const [selectedIconId, setSelectedIconId] = useState<string>('e_ruta_p_r');
    const [zoom, setZoom] = useState(1);
    const [markerScale, setMarkerScale] = useState(1.5); // Default to a more visible scale
    const [imageScale, setImageScale] = useState(1.0);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const [tool, setTool] = useState<'marker' | 'pan' | 'crop'>('marker');
    const [cropRect, setCropRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [customColor, setCustomColor] = useState('');
    const cropStartPos = useRef<{ x: number, y: number } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [phones, setPhones] = useState('SEGURIDAD PATRIMONIAL 7358');
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
        EVAC_ICONS.forEach(icon => {
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
        // Use high resolution scale and image scale
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
            const iconConfig = EVAC_ICONS.find(i => i.id === marker.icon);
            const color = marker.color || iconConfig?.color || '#10B981';
            
            ctx.save();
            // Scale markers to the high resolution and image scale, plus pan
            const renderX = (marker.x * imageScale + panX) * RESOLUTION_SCALE;
            const renderY = (marker.y * imageScale + panY) * RESOLUTION_SCALE;
            
            ctx.translate(renderX, renderY);
            
            // Adjust marker scale for high res
            const effectiveScale = ((marker.scale || markerScale) * RESOLUTION_SCALE);
            ctx.scale(effectiveScale, effectiveScale);

            if (iconConfig?.isArrow) {
                ctx.scale(3.0, 3.0); // Slightly bigger base for arrows
                ctx.translate(-12, -12);
                ctx.fillStyle = color;
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 2;
                ctx.fill(iconPaths[marker.icon!]);
            } else if (iconConfig?.isOutline) {
                ctx.scale(3.0, 3.0);
                ctx.translate(-12, -12);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.stroke(iconPaths[marker.icon!]);
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;

                ctx.beginPath();
                if (marker.icon === 'e_aqui') {
                    ctx.arc(0, 0, 30, 0, Math.PI * 2);
                } else {
                    ctx.rect(-25, -25, 50, 50);
                }
                ctx.fillStyle = color;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.save();
                ctx.translate(-12, -12);
                ctx.fillStyle = 'white';
                ctx.fill(iconPaths[marker.icon!]);
                ctx.restore();

                // ADD LEGEND TEXT ON CANVAS FOR SPECIAL ICONS
                if (marker.icon === 'e_aqui' || marker.icon === 'e_punto') {
                    ctx.save();
                    const labelText = marker.icon === 'e_aqui' ? 'USTED ESTÁ AQUÍ' : 'PUNTO DE ENCUENTRO';
                    const fontSize = 12; // Base font size
                    ctx.font = `bold ${fontSize}px Arial`;
                    const textWidth = ctx.measureText(labelText).width;
                    const padding = 6;
                    
                    // Position text above the icon
                    const textY = -45;
                    
                    // Draw background bubble
                    ctx.fillStyle = marker.icon === 'e_aqui' ? '#EF4444' : '#10B981';
                    
                    const x = -textWidth/2 - padding;
                    const y = textY - fontSize - padding;
                    const w = textWidth + padding * 2;
                    const h = fontSize + padding * 2;
                    
                    // Simple rounded rect
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, 4);
                    ctx.fill();
                    
                    // Draw pointer triangle
                    ctx.beginPath();
                    ctx.moveTo(-5, y + h);
                    ctx.lineTo(5, y + h);
                    ctx.lineTo(0, y + h + 5);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw text
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(labelText, 0, y + h/2 + 1);
                    ctx.restore();
                }
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
    }, [markers, markerScale, imageScale, iconPaths, panX, panY, cropRect, tool]);

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

        const iconLabel = EVAC_ICONS.find(i => i.id === selectedIconId)?.label;
        const newMarker: RiskMarker = {
            id: markers.length + 1,
            x, y,
            type: 'info',
            label: iconLabel || '',
            icon: selectedIconId,
            scale: markerScale,
            color: customColor || undefined
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

    const updateMarkerColor = (id: number, color: string) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, color } : m));
    };

    const updateMarkerScale = (id: number, scale: number) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, scale } : m));
    };

    const removeMarker = (id: number) => {
        setMarkers(markers.filter(m => m.id !== id));
    };

    const updateMarkerLabel = (id: number, label: string) => {
        setMarkers(markers.map(m => m.id === id ? { ...m, label } : m));
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
        
        const padding = exportWidth * 0.03;
        const headerHeight = exportHeight ? exportHeight * 0.12 : 350;
        const footerHeight = exportHeight ? exportHeight * 0.25 : 600;
        
        if (!exportHeight) {
            const scaleFactor = exportWidth / (canvas.width + (padding * 2));
            exportHeight = (canvas.height * scaleFactor) + headerHeight + footerHeight + (padding * 2);
        }
        
        finalCanvas.width = exportWidth;
        finalCanvas.height = exportHeight;
        
        const fctx = finalCanvas.getContext('2d', { alpha: false });
        if (!fctx) return null;

        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';

        // Background
        fctx.fillStyle = 'white';
        fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Main Border
        fctx.strokeStyle = '#1E293B';
        fctx.lineWidth = exportWidth * 0.004;
        fctx.strokeRect(10, 10, finalCanvas.width - 20, finalCanvas.height - 20);

        // --- HEADER BLOCK ---
        const headerY = 20;
        fctx.fillStyle = '#E11D48'; // Safety Red
        fctx.fillRect(20, headerY, finalCanvas.width - 40, headerHeight);
        
        fctx.fillStyle = 'white';
        fctx.textAlign = 'center';
        fctx.textBaseline = 'middle';
        
        // Main Title
        fctx.font = `bold ${headerHeight * 0.35}px Arial`;
        fctx.fillText('DIAGRAMA DE EVACUACIÓN', finalCanvas.width / 2, headerY + headerHeight * 0.40);
        
        // Subtitle
        fctx.font = `bold ${headerHeight * 0.20}px Arial`;
        fctx.fillText(`SECTOR: ${sector.toUpperCase()}`, finalCanvas.width / 2, headerY + headerHeight * 0.75);

        // Reset baseline
        fctx.textBaseline = 'alphabetic';

        // --- SUB-HEADER BOXES (Instructions & Phones) ---
        const boxY = headerY + headerHeight + 60;
        const boxHeight = exportHeight * 0.08;
        const boxWidth = (finalCanvas.width - (padding * 3)) / 2;
        
        // Instruction Box (Green)
        fctx.fillStyle = '#10B981';
        fctx.fillRect(padding, boxY, boxWidth, boxHeight);
        fctx.strokeStyle = '#065F46';
        fctx.lineWidth = 6;
        fctx.strokeRect(padding, boxY, boxWidth, boxHeight);
        
        fctx.fillStyle = 'white';
        fctx.font = `bold ${boxHeight * 0.15}px Arial`;
        fctx.textAlign = 'left';
        fctx.fillText('INSTRUCCIONES DE EMERGENCIA:', padding + 50, boxY + boxHeight * 0.25);
        fctx.font = `${boxHeight * 0.12}px Arial`;
        fctx.fillText('• Mantenga la calma, no corra ni grite.', padding + 50, boxY + boxHeight * 0.5);
        fctx.fillText('• Siga las flechas de evacuación principal.', padding + 50, boxY + boxHeight * 0.7);
        fctx.fillText('• Diríjase al Punto de Encuentro asignado.', padding + 50, boxY + boxHeight * 0.9);

        // Phone Box (Yellow)
        fctx.fillStyle = '#FBBF24';
        fctx.fillRect(padding + boxWidth + padding/2, boxY, boxWidth, boxHeight);
        fctx.strokeStyle = '#92400E';
        fctx.lineWidth = 6;
        fctx.strokeRect(padding + boxWidth + padding/2, boxY, boxWidth, boxHeight);
        
        fctx.fillStyle = 'black';
        fctx.textAlign = 'center';
        fctx.font = `bold ${boxHeight * 0.18}px Arial`;
        fctx.fillText('TELÉFONOS DE EMERGENCIA', padding + boxWidth + padding/2 + (boxWidth/2), boxY + boxHeight * 0.35);
        fctx.font = `bold ${boxHeight * 0.25}px Arial`;
        fctx.fillText(phones.toUpperCase(), padding + boxWidth + padding/2 + (boxWidth/2), boxY + boxHeight * 0.75);

        // --- DRAW PLAN ---
        const planY = boxY + boxHeight + 60;
        const planAreaWidth = finalCanvas.width - (padding * 2);
        const planAreaHeight = exportHeight - planY - footerHeight - padding;
        
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
        const drawY = planY + (planAreaHeight - drawH) / 2;

        fctx.drawImage(canvas, sourceX, sourceY, sourceW, sourceH, drawX, drawY, drawW, drawH);
        
        // Border around plan
        fctx.strokeStyle = '#CBD5E1';
        fctx.lineWidth = 4;
        fctx.strokeRect(drawX, drawY, drawW, drawH);

        // --- FOOTER LEYENDA ---
        const legendY = exportHeight - footerHeight + 20;
        fctx.fillStyle = '#F8FAFC';
        fctx.fillRect(padding, legendY, finalCanvas.width - (padding * 2), footerHeight - padding);
        fctx.strokeStyle = '#E2E8F0';
        fctx.lineWidth = 3;
        fctx.strokeRect(padding, legendY, finalCanvas.width - (padding * 2), footerHeight - padding);
        
        fctx.fillStyle = '#1E293B';
        fctx.textAlign = 'left';
        fctx.font = `bold ${exportWidth * 0.015}px Arial`;
        fctx.fillText('REFERENCIAS DE SEGURIDAD', padding + 40, legendY + 70);

        // Draw legend items in grid
        const usedIconIds = Array.from(new Set(markers.map(m => m.icon)));
        const legendIcons = EVAC_ICONS.filter(icon => usedIconIds.includes(icon.id));
        
        const cols = 5; // Increased columns for better space usage
        const itemWidth = (finalCanvas.width - (padding * 2) - 80) / cols;
        const itemHeight = 120; // Slightly taller for better spacing
        
        legendIcons.forEach((icon, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + 40 + (col * itemWidth);
            const y = legendY + 140 + (row * itemHeight);
            
            if (y > exportHeight - padding) return;

            // Draw Icon
            fctx.save();
            fctx.translate(x + 25, y - 15);
            fctx.scale(2.5, 2.5); // Slightly larger icons in legend
            fctx.translate(-12, -12);
            fctx.fillStyle = icon.color;
            if (icon.isOutline) {
                fctx.strokeStyle = icon.color;
                fctx.lineWidth = 2;
                fctx.stroke(iconPaths[icon.id]);
            } else {
                fctx.fill(iconPaths[icon.id]);
            }
            fctx.restore();
            
            fctx.fillStyle = '#334155';
            fctx.font = 'bold 28px Arial'; // Larger font for ultra quality
            fctx.fillText(icon.label.toUpperCase(), x + 75, y);
        });

        return finalCanvas;
    };

    const handleDownload = () => {
        const finalCanvas = generateProfessionalCanvas();
        if (!finalCanvas) return;
        const dataUrl = finalCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `PLANO_EVACUACION_PROFESIONAL_${sector.toUpperCase()}.png`;
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
        pdf.save(`PLANO_EVACUACION_PROFESIONAL_${sector.toUpperCase()}.pdf`);
    };

    const handlePrint = () => {
        // We'll use a hidden iframe or just the print-only div strategy
        window.print();
    };

    const usedIcons = Array.from(new Set(markers.map(m => m.icon)));

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)] lg:overflow-hidden">
            {/* Hidden Print Layout */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-visible">
                <div className="border-[12px] border-slate-800 h-full flex flex-col">
                    <div className="bg-[#E11D48] text-white p-8 text-center flex flex-col items-center justify-center border-b-[6px] border-white/20 relative overflow-hidden">
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20">
                            <img src={swiftLogoBase64} className="h-24 w-auto brightness-0 invert" alt="Logo Watermark" />
                        </div>
                        <div className="mb-4 relative z-10">
                            <ShieldCheckIcon className="h-16 w-16 text-white/90 mx-auto" />
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none relative z-10">Diagrama de Evacuación</h1>
                        <div className="mt-4 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 relative z-10">
                            <h2 className="text-2xl font-bold uppercase tracking-widest">SECTOR: {sector.toUpperCase()}</h2>
                        </div>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                            <img src={swiftLogoBase64} className="h-24 w-auto brightness-0 invert" alt="Logo Watermark" />
                        </div>
                    </div>
                    
                    <div className="flex gap-4 p-4">
                        <div className="flex-1 bg-[#10B981] text-white p-4 rounded border-2 border-[#065F46]">
                            <h3 className="font-bold text-lg mb-2 underline">INSTRUCCIONES DE EMERGENCIA:</h3>
                            <ul className="text-sm space-y-1">
                                <li>• Mantenga la calma, no corra ni grite.</li>
                                <li>• Siga las flechas de evacuación principal.</li>
                                <li>• Diríjase al Punto de Encuentro asignado.</li>
                                <li>• No use ascensores.</li>
                            </ul>
                        </div>
                        <div className="flex-1 bg-[#FBBF24] text-black p-4 rounded border-2 border-[#92400E] flex flex-col justify-center items-center">
                            <h3 className="font-bold text-lg mb-1">TELÉFONOS DE EMERGENCIA</h3>
                            <p className="text-4xl font-black tracking-widest">{phones}</p>
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
                        <h3 className="font-bold text-xl mb-4 text-slate-800">REFERENCIAS NORMATIVAS (ISO 7010)</h3>
                        <div className="grid grid-cols-3 gap-y-4 gap-x-8">
                            {usedIcons.map(iconId => {
                                const icon = EVAC_ICONS.find(i => i.id === iconId);
                                return (
                                    <div key={iconId} className="flex items-center gap-3">
                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                            <svg className="w-10 h-10" viewBox="0 0 24 24" style={{ fill: icon?.isArrow ? icon.color : 'none' }}>
                                                {icon?.isOutline ? (
                                                    <path d={icon.path} fill="none" stroke={icon.color} strokeWidth="2" />
                                                ) : icon?.isArrow ? (
                                                    <path d={icon.path} />
                                                ) : (
                                                    <g>
                                                        <rect width="24" height="24" rx="2" fill={icon?.color} />
                                                        <path d={icon?.path || ''} fill="white" transform="scale(0.6) translate(8, 8)" />
                                                    </g>
                                                )}
                                            </svg>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 uppercase">{icon?.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#E11D48] text-white p-4 flex justify-between items-center">
                        <p className="text-xl font-black">LA SEGURIDAD LA HACEMOS ENTRE TODOS</p>
                        <img src={swiftLogoBase64} className="h-12 w-auto brightness-0 invert" alt="Logo" />
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden print:hidden">
                {/* Lateral Toolbar (Desktop & Mobile) */}
                <div className="flex lg:flex-col bg-slate-800 p-2 lg:p-3 gap-2 lg:gap-4 flex-shrink-0 z-20 shadow-xl overflow-x-auto lg:overflow-y-auto scrollbar-hide">
                    <button 
                        onClick={() => setTool('marker')}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0 ${tool === 'marker' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        title="Marcadores"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Marcador</span>
                    </button>
                    <button 
                        onClick={() => setTool('pan')}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0 ${tool === 'pan' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        title="Mover"
                    >
                        <ArrowPathIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Mover</span>
                    </button>
                    <button 
                        onClick={() => setTool('crop')}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0 ${tool === 'crop' ? 'bg-brand-primary text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        title="Recortar"
                    >
                        <CropIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Recortar</span>
                    </button>

                    <div className="hidden lg:block h-px bg-slate-700 my-2 w-full"></div>
                    <div className="lg:hidden w-px bg-slate-700 mx-2 h-full"></div>

                    <button 
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className="p-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-30 min-w-[70px] lg:min-w-0"
                    >
                        <ArrowPathIcon className="w-6 h-6 transform rotate-180" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Deshacer</span>
                    </button>

                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0 ${showAdvanced ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <TableIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Ajustes</span>
                    </button>

                    <div className="hidden lg:block h-px bg-slate-700 my-2 w-full"></div>

                    <button 
                        onClick={handlePrint}
                        className="p-3 rounded-xl text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0"
                    >
                        <AiVisionIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Imprimir</span>
                    </button>

                    <button 
                        onClick={handleExportPDF}
                        className="p-3 rounded-xl bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all flex flex-col items-center justify-center gap-1 min-w-[70px] lg:min-w-0 shadow-lg shadow-brand-primary/10"
                    >
                        <DownloadIcon className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">PDF</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col overflow-hidden relative">
                    {/* Top Action Bar (Mobile Only for extra space) */}
                    <div className="lg:hidden bg-white border-b p-2 flex gap-2 overflow-x-auto scrollbar-hide">
                        <Input label="" value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="Teléfonos..." className="!mt-0 h-8 text-[10px] min-w-[120px]" />
                        <Button variant="secondary" size="xs" onClick={handleDownload} className="whitespace-nowrap">Imagen PNG</Button>
                    </div>

                    {/* Icon Selector (Horizontal Scrollable) */}
                    <div className="bg-white border-b shadow-sm z-10 flex-shrink-0">
                        <div className="flex items-center gap-2 p-2 overflow-x-auto scrollbar-hide">
                            <div className="flex items-center gap-2 border-r pr-2 mr-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Color:</span>
                                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none p-0" />
                            </div>
                            {EVAC_ICONS.map(icon => (
                                <button 
                                    key={icon.id} 
                                    onClick={() => { setSelectedIconId(icon.id); setTool('marker'); }} 
                                    className={`flex-shrink-0 group p-1.5 lg:p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${selectedIconId === icon.id ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-105' : 'bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                                    title={icon.label}
                                >
                                    <svg className={`w-6 h-6 lg:w-7 lg:h-7 transition-transform group-hover:scale-110 ${selectedIconId === icon.id ? 'fill-white stroke-white' : 'fill-current'}`} viewBox="0 0 24 24">
                                        {icon.isOutline ? (
                                            <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="2" />
                                        ) : (
                                            <path d={icon.path} />
                                        )}
                                    </svg>
                                    <span className="text-[7px] uppercase font-black truncate w-12 text-center leading-tight">{icon.label.split(' ').slice(-1)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Settings Overlay */}
                    {showAdvanced && (
                        <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-md p-4 border-b z-30 shadow-xl animate-in slide-in-from-top duration-300">
                            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Zoom Vista:</span>
                                    <input type="range" min="0.1" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Escala Plano:</span>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="0.5" max="2" step="0.1" value={imageScale} onChange={(e) => setImageScale(parseFloat(e.target.value))} className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                        <span className="text-[10px] font-mono font-bold text-brand-primary">{imageScale.toFixed(1)}x</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tamaño Iconos:</span>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="0.1" max="5" step="0.1" value={markerScale} onChange={(e) => setMarkerScale(parseFloat(e.target.value))} className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                                        <span className="text-[10px] font-mono font-bold text-brand-primary">{markerScale.toFixed(1)}x</span>
                                    </div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button size="xs" variant="secondary" onClick={handleFitToView} className="flex-1">Ajustar</Button>
                                    <Button size="xs" variant="secondary" onClick={() => { setPanX(0); setPanY(0); }} className="flex-1">Reset</Button>
                                </div>
                            </div>
                            <button onClick={() => setShowAdvanced(false)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Canvas Container */}
                    <div className="flex-grow relative overflow-hidden bg-slate-900 flex items-center justify-center">
                        <div 
                            ref={containerRef}
                            className={`relative w-full h-full overflow-hidden flex items-center justify-center scrollbar-hide printable-area ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <canvas 
                                ref={canvasRef} 
                                onClick={handleCanvasClick} 
                                className={`${tool === 'marker' ? 'cursor-crosshair' : ''} shadow-2xl bg-white transition-shadow`} 
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} 
                            />

                            {/* Print Area Indicator */}
                            <div 
                                className="absolute pointer-events-none border-2 border-dashed border-brand-primary/40 bg-brand-primary/5 flex items-center justify-center"
                                style={{
                                    width: '90%',
                                    height: 'auto',
                                    aspectRatio: '297/210',
                                    maxHeight: '95%',
                                    maxWidth: '95%'
                                }}
                            >
                                <div className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest bg-white/80 px-2 py-1 rounded border border-brand-primary/20">
                                    Área de Impresión A4
                                </div>
                            </div>

                            {/* Tool Overlays */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                                <div className="bg-black/70 text-white px-3 py-1 rounded text-[10px] font-bold backdrop-blur-sm border border-white/20">
                                    ZOOM: {(zoom * 100).toFixed(0)}%
                                </div>
                            </div>
                            
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-brand-primary/90 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest pointer-events-none backdrop-blur-md border border-white/30 shadow-lg z-10">
                                {tool === 'marker' ? `DISEÑO • ${markerScale.toFixed(1)}x` : tool === 'pan' ? 'MOVIMIENTO' : 'RECORTE'}
                            </div>

                            {cropRect && (
                                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse">
                                    <CropIcon className="w-3 h-3" /> Recorte Activo
                                    <button onClick={() => setCropRect(null)} className="ml-2 hover:bg-white/20 rounded p-0.5 pointer-events-auto">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collapsible Sidebar (References) */}
                <div className={`fixed lg:relative right-0 top-0 bottom-0 z-40 transition-all duration-300 flex ${showSidebar ? 'w-80' : 'w-0 lg:w-12'}`}>
                    {/* Toggle Button */}
                    <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="absolute left-0 top-1/2 -translate-x-full lg:translate-x-0 lg:left-0 bg-white border border-r-0 lg:border-r p-1.5 rounded-l-xl lg:rounded-none shadow-xl lg:shadow-none z-50 flex items-center justify-center hover:bg-slate-50"
                        style={{ height: '60px' }}
                    >
                        <div className="flex flex-col items-center gap-1">
                            <AiVisionIcon className={`w-5 h-5 text-brand-primary transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
                            <span className="text-[8px] font-black uppercase vertical-text hidden lg:block">Panel</span>
                        </div>
                    </button>

                    <div className={`bg-white border-l h-full flex flex-col overflow-hidden shadow-2xl lg:shadow-none ${showSidebar ? 'w-80' : 'w-0'}`}>
                        <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 text-sm flex items-center">
                                <AiVisionIcon className="w-4 h-4 mr-2 text-brand-primary" /> Referencias ({markers.length})
                            </h3>
                            <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 text-slate-400">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4">
                            {/* Legend Section */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simbología Utilizada</p>
                                {usedIcons.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">No hay iconos colocados</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {usedIcons.map(iconId => {
                                            const icon = EVAC_ICONS.find(i => i.id === iconId);
                                            const count = markers.filter(m => m.icon === iconId).length;
                                            return (
                                                <div key={iconId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shadow-sm">
                                                            <svg className="w-5 h-5" viewBox="0 0 24 24" style={{ fill: icon?.isArrow ? icon.color : (icon?.isOutline ? 'none' : icon?.color) }}>
                                                                {icon?.isOutline ? (
                                                                    <path d={icon.path} fill="none" stroke={icon.color} strokeWidth="2" />
                                                                ) : (
                                                                    <path d={icon?.path} fill={icon?.isArrow ? icon.color : (icon?.isOutline ? 'none' : 'white')} />
                                                                )}
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-700 uppercase leading-none">{icon?.label}</p>
                                                            <p className="text-[9px] text-slate-400 mt-1">Norma ISO 7010</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100 my-4"></div>

                            {/* Layers Section */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capas del Plano</p>
                                {markers.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed">
                                        <ArrowPathIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[10px] text-slate-400 px-4 italic">Haz clic en el plano para trazar rutas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {[...markers].reverse().map(m => (
                                            <div key={m.id} className="group p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2 hover:border-brand-primary/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-md shadow-sm border border-white/50" style={{ backgroundColor: m.color || EVAC_ICONS.find(i => i.id === m.icon)?.color }}>
                                                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                                            <path d={EVAC_ICONS.find(i => i.id === m.icon)?.path} />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">#{m.id}</span>
                                                        <span className="text-[10px] font-bold text-slate-700 truncate leading-tight uppercase">{EVAC_ICONS.find(i => i.id === m.icon)?.label}</span>
                                                    </div>
                                                    <button onClick={() => setMarkers(markers.filter(x => x.id !== m.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <input type="color" value={m.color || EVAC_ICONS.find(i => i.id === m.icon)?.color || '#10B981'} onChange={(e) => updateMarkerColor(m.id, e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none p-0" />
                                                    <input type="range" min="0.1" max="5" step="0.1" value={m.scale || 1.5} onChange={(e) => updateMarkerScale(m.id, parseFloat(e.target.value))} className="flex-1 h-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 border-t">
                            <p className="text-[10px] text-emerald-800 leading-relaxed">
                                <strong>Tip:</strong> Usa flechas sólidas para rutas principales y de contorno para alternativas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvacuationPlanEditor;