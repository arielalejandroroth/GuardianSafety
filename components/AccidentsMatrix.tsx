import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { AccidentReport, View, ArtClassification, Causal, IncidentType, CauseTreeAnalysis, Gender, TaskType, EmployeeType, CorrectiveActionPlan, ActionType } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import { DocumentAddIcon, SparklesIcon, PrintIcon, UploadIcon, DownloadIcon, PencilIcon, TableIcon, DashboardIcon, EyeIcon, TrashIcon, ArrowPathIcon, WordIcon } from './IconComponents';
import Select from './common/Select';
import MultiSelect from './common/MultiSelect';
import { generateCauseTreeAnalysis } from '../services/geminiService';
import { downloadIncidentWordDocument } from '../services/wordExportService';
import Modal from './common/Modal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CauseTreeDiagram from './CauseTreeDiagram';
import Card from './common/Card';
import TextArea from './common/TextArea';
import DataAnalysisModal from './DataAnalysisModal';
import EditAccidentModal from './EditAccidentModal';
import ConfirmModal from './common/ConfirmModal';
import { minervaLogoBase64 } from '../assets/logo';
import AccidentProfileDashboard from './AccidentProfileDashboard';
import { useAppContext } from '../contexts/AppContext';

interface AccidentsMatrixProps {
  accidents: AccidentReport[];
  onNavigate: (view: View) => void;
}

const ITEMS_PER_PAGE = 25;

const calculateSickDays = (incidentDateStr: string, medicalReleaseDateStr?: string, classification?: ArtClassification): number | string => {
    if (!classification || ![ArtClassification.CAF, ArtClassification.CAFI].includes(classification) || !medicalReleaseDateStr || !incidentDateStr) {
        return 0;
    }

    const incidentDate = new Date(incidentDateStr);
    const medicalReleaseDate = new Date(medicalReleaseDateStr);

    if (isNaN(incidentDate.getTime()) || isNaN(medicalReleaseDate.getTime()) || medicalReleaseDate < incidentDate) {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (medicalReleaseDate > today) {
            return `P: ${Math.ceil((medicalReleaseDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24))}`; // Projected
        }
        return 'N/A';
    }

    const diffTime = medicalReleaseDate.getTime() - incidentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
};

const calculateSeniority = (hireDateStr?: string, toDateStr?: string): string => {
    if (!hireDateStr) return 'N/A';
    const hireDate = new Date(hireDateStr);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();
    if (isNaN(hireDate.getTime()) || isNaN(toDate.getTime()) || hireDate > toDate) return 'N/A';

    let years = toDate.getFullYear() - hireDate.getFullYear();
    let months = toDate.getMonth() - hireDate.getMonth();
    
    if (toDate.getDate() < hireDate.getDate()) {
        months--;
    }

    if (months < 0) {
        years--;
        months += 12;
    }
    
    if (years < 0) return 'N/A';

    const parts = [];
    if (years > 0) parts.push(`${years}a`);
    if (months > 0 || years === 0) parts.push(`${months}m`);
    
    return parts.length > 0 ? parts.join(' ') : '0m';
};


const AccidentsMatrix: React.FC<AccidentsMatrixProps> = ({ accidents, onNavigate }) => {
  const { dispatch } = useAppContext();
  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('table');
  const [filterText, setFilterText] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [filterArtClassification, setFilterArtClassification] = useState('');
  const [filterCausal, setFilterCausal] = useState('');
  const [filterLegajo, setFilterLegajo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterSectors, setFilterSectors] = useState<string[]>([]);
  const [filterEmployeeType, setFilterEmployeeType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [selectedAccident, setSelectedAccident] = useState<AccidentReport | null>(null);
  const [editingAccident, setEditingAccident] = useState<AccidentReport | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CauseTreeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [isPreparingWord, setIsPreparingWord] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
  const [editableAnalysisText, setEditableAnalysisText] = useState('');
  const [editableRootCauses, setEditableRootCauses] = useState<string[]>([]);
  const [editableAccionesCorrectivas, setEditableAccionesCorrectivas] = useState<CorrectiveActionPlan[]>([]);

  const [accidentToDelete, setAccidentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [accidentToRegenerate, setAccidentToRegenerate] = useState<AccidentReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const plants = useMemo(() => [...new Set(accidents.map(a => a.planta))].sort(), [accidents]);
  const sectors = useMemo(() => [...new Set(accidents.map(a => a.sector).filter(Boolean))].sort(), [accidents]);
  const artClassifications = useMemo(() => Object.values(ArtClassification), []);
  const causals = useMemo(() => Object.values(Causal), []);
  const employeeTypes = useMemo(() => Object.values(EmployeeType), []);
  
  const sortedAccidents = useMemo(() => {
    return [...accidents].sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        const fallbackA = isNaN(timeA) ? 0 : timeA;
        const fallbackB = isNaN(timeB) ? 0 : timeB;
        return fallbackB - fallbackA;
    });
  }, [accidents]);

  const filteredAccidents = useMemo(() => {
    return sortedAccidents.filter(accident => {
      const searchText = filterText.toLowerCase();
      const searchLegajo = filterLegajo.toLowerCase();
      const matchesText = (
        ((accident.id || '').toLowerCase().includes(searchText)) ||
        ((accident.collaboratorName || '').toLowerCase().includes(searchText)) ||
        ((accident.sector || '').toLowerCase().includes(searchText)) ||
        ((accident.area || '').toLowerCase().includes(searchText)) ||
        ((accident.tipoLesion || '').toLowerCase().includes(searchText)) ||
        ((accident.puesto || '').toLowerCase().includes(searchText)) ||
        ((accident.supervisor || '').toLowerCase().includes(searchText))
      );
      
      const matchesPlant = filterPlant === '' || accident.planta === filterPlant;
      const matchesArtClassification = filterArtClassification === '' || accident.clasificacionART === filterArtClassification;
      const matchesCausal = filterCausal === '' || accident.causal === filterCausal;
      const matchesLegajo = searchLegajo === '' || (accident.legajo || '').toLowerCase().includes(searchLegajo);
      const matchesDate = filterDate === '' || accident.date === filterDate;
      const accidentYear = accident.date ? new Date(accident.date).getUTCFullYear().toString() : '';
      const accidentMonth = accident.date ? (new Date(accident.date).getUTCMonth() + 1).toString() : '';
      const matchesYear = filterYear === '' || accidentYear === filterYear;
      const matchesMonth = filterMonth === '' || accidentMonth === filterMonth;
      const matchesSector = filterSectors.length === 0 || filterSectors.includes(accident.sector);
      const matchesEmployeeType = filterEmployeeType === '' || accident.employeeType === filterEmployeeType;

      return matchesText && matchesPlant && matchesArtClassification && matchesCausal && matchesLegajo && matchesDate && matchesYear && matchesMonth && matchesSector && matchesEmployeeType;
    });
  }, [sortedAccidents, filterText, filterPlant, filterArtClassification, filterCausal, filterLegajo, filterDate, filterYear, filterMonth, filterSectors, filterEmployeeType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterPlant, filterArtClassification, filterCausal, filterLegajo, filterDate, filterYear, filterMonth, filterSectors, filterEmployeeType]);

  const totalPages = Math.ceil(filteredAccidents.length / ITEMS_PER_PAGE);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  const paginatedAccidents = useMemo(() => {
      return filteredAccidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredAccidents, currentPage]);

  const generateAnalysis = async (accident: AccidentReport) => {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      setSelectedAccident(accident);
      try {
          const result = await generateCauseTreeAnalysis(accident);
          setAnalysisResult(result);
          setEditableAnalysisText(result.analisis);
          setEditableRootCauses(result.causasRaiz);
          setEditableAccionesCorrectivas(result.accionesCorrectivas || []);
          
          const updatedAccident = { ...accident, causeTreeAnalysis: result };
          dispatch({ type: ActionType.UPDATE_ACCIDENT, payload: updatedAccident });
      } catch (error: any) {
          console.error("Error generating analysis:", error);
          const rawMsg = error instanceof Error ? error.message : "Error al generar el análisis.";
          const friendlyMsg = rawMsg.includes("API") || rawMsg.includes("configurada")
            ? "La función de análisis con Inteligencia Artificial requiere que el administrador configure la API_KEY en el servidor Hostinger."
            : rawMsg;
          alert(friendlyMsg);
          setSelectedAccident(null); // Close modal on error
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleAnalysisClick = useCallback((accident: AccidentReport) => {
    setSelectedAccident(accident);
    setIsEditingAnalysis(false);

    if (accident.causeTreeAnalysis) {
        setAccidentToRegenerate(accident);
    } else {
        generateAnalysis(accident);
    }
}, [dispatch]);

  const handleConfirmRegenerate = () => {
      if (accidentToRegenerate) {
          generateAnalysis(accidentToRegenerate);
          setAccidentToRegenerate(null);
      }
  };

  const handleCancelRegenerate = () => {
      if (accidentToRegenerate?.causeTreeAnalysis) {
          setAnalysisResult(accidentToRegenerate.causeTreeAnalysis);
          setEditableAnalysisText(accidentToRegenerate.causeTreeAnalysis.analisis);
          setEditableRootCauses(accidentToRegenerate.causeTreeAnalysis.causasRaiz);
          setEditableAccionesCorrectivas(accidentToRegenerate.causeTreeAnalysis.accionesCorrectivas || []);
      }
      setAccidentToRegenerate(null);
  };

  const handleEditClick = (accident: AccidentReport) => {
    setEditingAccident(accident);
  };
  
  const handleSaveAccident = (updatedAccident: AccidentReport) => {
    dispatch({ type: ActionType.UPDATE_ACCIDENT, payload: updatedAccident });
    setEditingAccident(null);
  };
  
  const handleDeleteClick = useCallback((accidentId: string, accidentName: string) => {
      setAccidentToDelete({ id: accidentId, name: accidentName });
  }, []);

  const confirmDelete = () => {
      if (accidentToDelete) {
          dispatch({ type: ActionType.DELETE_ACCIDENT, payload: accidentToDelete.id });
          setAccidentToDelete(null);
      }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseExcelDate = (excelDate: any): string => {
    if (!excelDate) return '';
    if (excelDate instanceof Date) {
        const tzOffset = excelDate.getTimezoneOffset() * 60000;
        return new Date(excelDate.getTime() - tzOffset).toISOString().split('T')[0];
    }
    if (typeof excelDate === 'number') {
        const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        const tzOffset = jsDate.getTimezoneOffset() * 60000;
        return new Date(jsDate.getTime() + tzOffset).toISOString().split('T')[0];
    }
    if (typeof excelDate === 'string') {
        const parts = excelDate.match(/(\d+)/g);
        if (parts && parts.length >= 3) {
            let [day, month, year] = parts.map(p => parseInt(p, 10));
            if (month > 12 && day <= 12) {
                const temp = day;
                day = month;
                month = temp;
            }
            if(!isNaN(day) && !isNaN(month) && !isNaN(year) && month <= 12 && day <= 31) {
                const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
                return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        if (!isNaN(Date.parse(excelDate))) {
            return new Date(excelDate).toISOString().split('T')[0];
        }
    }
    return '';
};

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInputTarget = event.target as HTMLInputElement;
    const file = fileInputTarget.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(10); // Start progress

    const reader = new FileReader();

    // simulate progress while reading
    const progressInterval = setInterval(() => {
        setImportProgress(prev => (prev < 80 ? prev + 10 : prev));
    }, 150);

    reader.onload = (e) => {
        setTimeout(() => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                setImportProgress(85); // Reading done, parsing...

                // Encontrar la fila de encabezados correcta de manera robusta
                const dataAOA: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                
                const normalizeHeader = (str: string) => str ? String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase().trim() : '';

                let headerRowIdx = dataAOA.findIndex(row => row && Array.isArray(row) && row.some(cell => {
                    const cellStr = normalizeHeader(cell);
                    return cellStr === 'legajo' || cellStr === 'apellido y nombre' || cellStr === 'item' || cellStr === 'n°' || cellStr === 'apellido' || cellStr === 'fecha';
                }));
                
                if (headerRowIdx === -1) {
                    headerRowIdx = dataAOA.findIndex(row => row && Array.isArray(row) && row.filter(cell => typeof cell === 'string' && cell.trim() !== '').length > 3);
                    if (headerRowIdx === -1) headerRowIdx = 0;
                }

                const headers = dataAOA[headerRowIdx].map(h => normalizeHeader(h));
                const dataRows = dataAOA.slice(headerRowIdx + 1);

                const newAccidents: AccidentReport[] = dataRows.map((rowArr, index) => {
                    try {
                        const hasAnyData = rowArr.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
                        if (!hasAnyData) return null;

                        const getVal = (...possibleHeaders: string[]) => {
                            for (const ph of possibleHeaders) {
                                const norm = normalizeHeader(ph);
                                const hIdx = headers.findIndex(h => h === norm);
                                if (hIdx !== -1 && rowArr[hIdx] !== null && rowArr[hIdx] !== undefined && rowArr[hIdx] !== '') {
                                    return rowArr[hIdx];
                                }
                            }
                            return undefined;
                        };
                        
                        const getStringVal = (...h: string[]): string => String(getVal(...h) || '').trim();

                        const nombre = getStringVal('Apellido y Nombre', 'Apellido', 'Nombre', 'Colaborador');

                        const mapToEnum = <T extends object>(value: any, enumObject: T, defaultValue: T[keyof T]): T[keyof T] => {
                            const strValue = String(value || '').trim();
                            if (!strValue) return defaultValue;
                            const normalizedValue = normalizeHeader(strValue);
                            // Verify both object values and object keys
                            const enumValueMatch = Object.keys(enumObject).find(k => normalizeHeader(String((enumObject as any)[k])) === normalizedValue);
                            const enumKeyMatch = Object.keys(enumObject).find(k => normalizeHeader(String(k)) === normalizedValue);
                            return enumValueMatch ? (enumObject as any)[enumValueMatch] : (enumKeyMatch ? (enumObject as any)[enumKeyMatch] : defaultValue);
                        };
                        
                        let accidentDate = '';
                        const fechaVal = getVal('Fecha');
                        if (fechaVal) {
                            accidentDate = parseExcelDate(fechaVal);
                        } else {
                            const year = getStringVal('Año');
                            const month = getStringVal('Mes');
                            const day = getStringVal('Día');
                            if (year && month && day && !isNaN(parseInt(year)) && !isNaN(parseInt(month)) && !isNaN(parseInt(day))) {
                                const paddedMonth = String(month).padStart(2, '0');
                                const paddedDay = String(day).padStart(2, '0');
                                accidentDate = `${year}-${paddedMonth}-${paddedDay}`;
                            } else {
                                // Extract year/month/day from strings if possible
                                const re = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/;
                                const searchStr = rowArr.filter(cell => cell !== null && cell !== undefined).join(' ');
                                const match = searchStr.match(re);
                                if(match) {
                                    accidentDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                                }
                            }
                        }
                        if (!accidentDate) {
                            accidentDate = new Date().toISOString().split('T')[0]; // fallback to today
                        }

                        return {
                            id: `A-${getStringVal('Ítem', 'N°') || `IMP-${Date.now()}-${index}`}`,
                            planta: getStringVal('Unidad', 'Planta') || 'N/A',
                            date: accidentDate,
                            time: getStringVal('Hora') || '00:00',
                            sector: getStringVal('Sector del Colaborador', 'Sector') || 'N/A',
                            area: getStringVal('Sector del Accidente', 'Lugar del Accidente', 'Área') || 'N/A',
                            lugar: getStringVal('Departamento', 'Lugar del Accidente', 'Lugar') || 'N/A',
                            puesto: getStringVal('Puesto de Trabajo', 'Sector del Colaborador') || 'N/A',
                            employeeType: EmployeeType.PROPIO,
                            collaboratorName: nombre || 'N/A',
                            legajo: getStringVal('Legajo'),
                            fechaIngreso: parseExcelDate(getVal('Fecha de ingreso', 'F. Ingreso')),
                            genero: mapToEnum(getVal('Género'), Gender, Gender.NO_ESPECIFICADO),
                            supervisor: getStringVal('Supervisor / Jefe', 'Supervisor') || 'N/A',
                            tipo: mapToEnum(getVal('Tipo de Evento', 'Tipo'), IncidentType, IncidentType.ACCIDENTE),
                            clasificacionART: mapToEnum(getVal('Clasificación del Evento', 'Clasificación'), ArtClassification, ArtClassification.INCIDENTE),
                            description: getStringVal('Descripción de evento', 'Descripción') || '',
                            tipoLesion: getStringVal('Naturaleza / Tipo de Lesión', 'Tipo de Lesión') || '',
                            parteCuerpoAfectada: getStringVal('Región corporal afectada', 'Parte del Cuerpo', 'Parte del Cuerpo Afectada') || '',
                            agenteMaterial: getStringVal('Agente Lesional / Causador', 'Agente Material') || '',
                            tareaRutinaria: mapToEnum(getVal('Tarea (producción): Rutinaria - No Rutinaria', 'Tarea'), TaskType, TaskType.RUTINARIA),
                            causal: mapToEnum(getVal('Acto / Condición Subestándar', 'Causal'), Causal, Causal.CONDICION),
                            utilizaEpp: (getStringVal('UTILIZA EPP SEGÚN MATRIZ?', 'utilizaEpp').toUpperCase() === 'SI' ? 'SI' : getStringVal('UTILIZA EPP SEGÚN MATRIZ?', 'utilizaEpp').toUpperCase() === 'NO' ? 'NO' : 'N/A') as ('SI' | 'NO' | 'N/A' | ''),
                            costo: getStringVal('Costo ($)').replace(/[^0-9]/g, '') || '0',
                            fechaAltaMedica: parseExcelDate(getVal('Fecha de Alta', 'Fecha Alta', 'Fecha Alta Medica', 'Alta')),
                            immediateActions: '', 
                            correctiveActions: getStringVal('Acciones Correctivas') || '',
                            attachments: [],
                        } as AccidentReport;
                    } catch (rowError) {
                        console.error(`Error parsing row ${index}:`, rowError, rowArr);
                        return null;
                    }
                }).filter((a: AccidentReport | null): a is AccidentReport => a !== null);
                
                setImportProgress(95);

                const delay = setTimeout(() => {
                    clearInterval(progressInterval);
                    setImportProgress(100);

                    if (newAccidents.length === 0) {
                        alert("No se encontraron datos de accidentes válidos en el archivo. Verifique el formato y los encabezados de las columnas (ej: N°, Planta, Apellido y Nombre, Fecha o Año/Mes/Día).");
                        setIsImporting(false);
                        return;
                    }

                    dispatch({ type: ActionType.SET_ACCIDENTS, payload: newAccidents });
                    alert(`Importación exitosa.\n\nSe han reemplazado los datos anteriores y cargado ${newAccidents.length} incidentes del archivo.`);
                    setIsImporting(false);
                }, 300);

            } catch (error) {
                console.error("Error al importar el archivo:", error);
                alert("Hubo un error al procesar el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) válido.");
                clearInterval(progressInterval);
                setIsImporting(false);
            } finally {
                 if (fileInputTarget) fileInputTarget.value = '';
            }
        }, 100); // Small timeout to allow React to render the progress UI
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleExport = () => {
    const dataToExport = filteredAccidents.map(acc => ({
        'N°': acc.id.replace('A-', ''),
        'Año': acc.date ? new Date(acc.date).getUTCFullYear() : '',
        'Mes': acc.date ? new Date(acc.date).getUTCMonth() + 1 : '',
        'Día': acc.date ? new Date(acc.date).getUTCDate() : '',
        'Planta': acc.planta,
        'Tipo Empleado': acc.employeeType,
        'Empresa Contratista': acc.contractorCompany || '',
        'Apellido y Nombre': acc.collaboratorName,
        'Legajo': acc.legajo,
        'F. Ingreso': acc.fechaIngreso,
        'Antigüedad': calculateSeniority(acc.fechaIngreso, acc.date),
        'Género': acc.genero,
        'Clasificación': acc.clasificacionART,
        'Tipo': acc.tipo,
        'Sector': acc.sector,
        'Lugar del Accidente': acc.area,
        'Puesto de Trabajo': acc.puesto,
        'Supervisor': acc.supervisor,
        'Descripción': acc.description,
        'Tipo de Lesión': acc.tipoLesion,
        'Parte del Cuerpo': acc.parteCuerpoAfectada,
        'Agente Material': acc.agenteMaterial,
        'Tarea': acc.tareaRutinaria,
        'Causal': acc.causal,
        'Costo ($)': acc.costo,
        'Fecha Alta': acc.fechaAltaMedica,
        'Días de Baja': calculateSickDays(acc.date, acc.fechaAltaMedica, acc.clasificacionART),
        'Acciones Correctivas': acc.correctiveActions
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de Accidentes");
    XLSX.writeFile(wb, "Historial_Accidentes.xlsx");
};

    useEffect(() => {
        if (!isPreparingPdf || !pdfContainerRef.current || !selectedAccident || !analysisResult) return;

        const performPdfGeneration = async () => {
            try {
                const element = pdfContainerRef.current!;
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
                const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

                // Márgenes simétricos: 35 pt (~12.4 mm)
                const marginX = 35;
                const marginY = 35;
                const printableWidth = pdfWidth - (marginX * 2); // 525.28 pt
                const printableHeight = pdfHeight - (marginY * 2); // 771.89 pt

                const pxPerPt = canvas.width / printableWidth;
                const footerReservedPt = 22; // Espacio reservado para el pie de página
                const maxPageContentHeightPt = printableHeight - footerReservedPt;
                const maxSliceHeightPx = Math.floor(maxPageContentHeightPt * pxPerPt);

                const addFooter = (pageNum: number, totalPagesCount: number) => {
                    pdf.setFontSize(8);
                    pdf.setTextColor(148, 163, 184); // slate-400
                    pdf.text(`SafetyGuard Pro - Informe de Investigación de Incidente N° ${selectedAccident.id}`, marginX, pdfHeight - 18);
                    pdf.text(`Página ${pageNum} de ${totalPagesCount}`, pdfWidth - marginX, pdfHeight - 18, { align: 'right' });
                };

                // Helper para verificar si una fila horizontal del canvas no tiene tinta/texto (fondo limpio)
                const canvasCtx = canvas.getContext('2d');
                const isCleanRow = (y: number): boolean => {
                    if (!canvasCtx || y < 0 || y >= canvas.height) return false;
                    try {
                        const imgData = canvasCtx.getImageData(0, Math.floor(y), canvas.width, 1).data;
                        let inkPixels = 0;
                        // Muestreo cada 3 píxeles para alta precisión y óptimo rendimiento
                        for (let x = 0; x < canvas.width; x += 3) {
                            const idx = x * 4;
                            const r = imgData[idx];
                            const g = imgData[idx + 1];
                            const b = imgData[idx + 2];
                            const a = imgData[idx + 3];
                            // Si el pixel no es blanco ni fondo gris claro (es un trazo de texto o línea oscura)
                            if (a > 40 && (r < 230 || g < 230 || b < 230)) {
                                inkPixels++;
                                if (inkPixels > 4) return false;
                            }
                        }
                        return true;
                    } catch {
                        return false;
                    }
                };

                // Busca una línea libre de trazos alrededor del punto de corte
                const findCleanCutY = (targetY: number, minY: number): number => {
                    const clampedTarget = Math.min(Math.floor(targetY), canvas.height - 1);
                    if (isCleanRow(clampedTarget)) return clampedTarget;

                    // Escaneo hacia arriba primero para no exceder el alto de página
                    for (let d = 1; d <= 45; d++) {
                        const yUp = clampedTarget - d;
                        if (yUp >= minY && isCleanRow(yUp)) return yUp;
                        const yDown = clampedTarget + d;
                        if (yDown < canvas.height && isCleanRow(yDown)) return yDown;
                    }
                    return clampedTarget;
                };

                // Caso 1: Si el contenido cabe en una sola página (con hasta 4% de holgura para evitar páginas extra vacías)
                const totalImgHeightPt = canvas.height / pxPerPt;
                if (totalImgHeightPt <= printableHeight * 1.04) {
                    let renderHeightPt = totalImgHeightPt;
                    let renderWidthPt = printableWidth;
                    let renderX = marginX;

                    if (totalImgHeightPt > printableHeight) {
                        const scale = printableHeight / totalImgHeightPt;
                        renderHeightPt = printableHeight;
                        renderWidthPt = printableWidth * scale;
                        renderX = (pdfWidth - renderWidthPt) / 2;
                    }

                    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', renderX, marginY, renderWidthPt, renderHeightPt);
                    addFooter(1, 1);
                } else {
                    // Caso 2: Paginación inteligente basada en bloques DOM y detección de espacios limpios
                    const containerRect = element.getBoundingClientRect();
                    const scaleY = canvas.height / containerRect.height;

                    // Recolectar todos los elementos atómicos que no deben ser cortados por la mitad
                    const atomicEls = Array.from(
                        element.querySelectorAll(
                            '[data-pdf-block], tr, li, h1, h2, h3, .tree-diagram-container, .tree-legend'
                        )
                    ) as HTMLElement[];

                    const blocks = atomicEls
                        .map(el => {
                            const r = el.getBoundingClientRect();
                            return {
                                top: (r.top - containerRect.top) * scaleY,
                                bottom: (r.bottom - containerRect.top) * scaleY,
                                isHeading: /^H[1-6]$/.test(el.tagName) || el.getAttribute('data-pdf-heading') === 'true'
                            };
                        })
                        .filter(b => b.bottom > b.top && b.bottom <= canvas.height + 10)
                        .sort((a, b) => a.top - b.top);

                    const slices: { startY: number; endY: number }[] = [];
                    let sourceY = 0;

                    while (sourceY < canvas.height) {
                        const remainingPx = canvas.height - sourceY;
                        if (remainingPx <= maxSliceHeightPx) {
                            slices.push({ startY: sourceY, endY: canvas.height });
                            break;
                        }

                        let candidateCutY = sourceY + maxSliceHeightPx;

                        // 1. Evitar cortar cualquier bloque por la mitad
                        for (let i = 0; i < blocks.length; i++) {
                            const b = blocks[i];
                            if (candidateCutY > b.top && candidateCutY < b.bottom) {
                                // Mover el corte justo antes del inicio de este bloque
                                candidateCutY = Math.floor(b.top) - 3;
                                break;
                            }
                        }

                        // 2. Evitar encabezados huérfanos (títulos que quedarían solos al final de la página)
                        for (let i = 0; i < blocks.length; i++) {
                            const b = blocks[i];
                            if (b.isHeading && b.top >= sourceY && b.bottom <= candidateCutY) {
                                if ((candidateCutY - b.bottom) < 40) {
                                    candidateCutY = Math.floor(b.top) - 3;
                                    break;
                                }
                            }
                        }

                        // 3. Salvaguarda: si el corte retrocedió demasiado (ej. un bloque gigante), buscar espacio en blanco entre líneas
                        if (candidateCutY <= sourceY + (maxSliceHeightPx * 0.25)) {
                            candidateCutY = findCleanCutY(
                                sourceY + maxSliceHeightPx,
                                sourceY + Math.floor(maxSliceHeightPx * 0.5)
                            );
                        } else {
                            // Ajustar microscópicamente candidateCutY para asegurar fila 100% limpia sin trazos
                            candidateCutY = findCleanCutY(candidateCutY, sourceY + (maxSliceHeightPx * 0.2));
                        }

                        // Si por algún motivo extremo no avanza, forzar avance seguro
                        if (candidateCutY <= sourceY) {
                            candidateCutY = sourceY + maxSliceHeightPx;
                        }

                        slices.push({ startY: sourceY, endY: candidateCutY });
                        sourceY = candidateCutY;
                    }

                    // Renderizar cada página limpiamente en el PDF
                    const totalPages = slices.length;
                    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                        if (pageIdx > 0) {
                            pdf.addPage();
                        }

                        const slice = slices[pageIdx];
                        const sliceHeightPx = slice.endY - slice.startY;
                        const sliceHeightPt = sliceHeightPx / pxPerPt;

                        const pageCanvas = document.createElement('canvas');
                        pageCanvas.width = canvas.width;
                        pageCanvas.height = sliceHeightPx;
                        const pageCtx = pageCanvas.getContext('2d');
                        if (pageCtx) {
                            pageCtx.fillStyle = '#ffffff';
                            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                            pageCtx.drawImage(
                                canvas,
                                0, slice.startY, canvas.width, sliceHeightPx,
                                0, 0, canvas.width, sliceHeightPx
                            );
                        }

                        pdf.addImage(
                            pageCanvas.toDataURL('image/png', 1.0),
                            'PNG',
                            marginX,
                            marginY,
                            printableWidth,
                            sliceHeightPt
                        );

                        addFooter(pageIdx + 1, totalPages);
                    }
                }

                pdf.save(`Informe_Investigacion_${selectedAccident.id}.pdf`);
            } catch (err) {
                console.error("Error generating PDF:", err);
                alert("Hubo un error al generar el PDF.");
            } finally {
                setIsPreparingPdf(false);
            }
        };

        const timer = setTimeout(performPdfGeneration, 350);
        return () => clearTimeout(timer);
    }, [isPreparingPdf, selectedAccident, analysisResult]);

    const handleDownloadPdf = () => {
        if (!selectedAccident || !analysisResult) return;
        setIsPreparingPdf(true);
    };

    const handleDownloadWord = async () => {
        if (!selectedAccident || !analysisResult) return;
        setIsPreparingWord(true);
        try {
            let diagramBase64: string | null = null;
            let diagramDimensions: { width: number; height: number } | null = null;

            // Capturar el contenedor del diagrama de causas renderizado
            const treeContainer = document.querySelector<HTMLElement>('#analysis-modal-content .tree-diagram-container')
                || document.querySelector<HTMLElement>('.tree-diagram-container');

            const trimCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
                const ctx = sourceCanvas.getContext('2d');
                if (!ctx) return sourceCanvas;
                const { width, height } = sourceCanvas;
                const imgData = ctx.getImageData(0, 0, width, height);
                const { data } = imgData;

                let minX = width, minY = height, maxX = 0, maxY = 0;
                let found = false;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];

                        // Detectar trazos de líneas, nodos y textos no blancos
                        if (a > 30 && (r < 245 || g < 245 || b < 245)) {
                            found = true;
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                if (!found) return sourceCanvas;

                // Añadir margen limpio alrededor de los elementos reales del diagrama
                const padding = 30;
                minX = Math.max(0, minX - padding);
                minY = Math.max(0, minY - padding);
                maxX = Math.min(width - 1, maxX + padding);
                maxY = Math.min(height - 1, maxY + padding);

                const trimmedWidth = maxX - minX + 1;
                const trimmedHeight = maxY - minY + 1;

                const trimmed = document.createElement('canvas');
                trimmed.width = trimmedWidth;
                trimmed.height = trimmedHeight;
                const tCtx = trimmed.getContext('2d');
                if (!tCtx) return sourceCanvas;

                tCtx.fillStyle = '#ffffff';
                tCtx.fillRect(0, 0, trimmedWidth, trimmedHeight);
                tCtx.drawImage(
                    sourceCanvas,
                    minX, minY, trimmedWidth, trimmedHeight,
                    0, 0, trimmedWidth, trimmedHeight
                );

                return trimmed;
            };

            if (treeContainer) {
                try {
                    const rawCanvas = await html2canvas(treeContainer, {
                        scale: 3,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });
                    const finalCanvas = trimCanvas(rawCanvas);
                    diagramBase64 = finalCanvas.toDataURL('image/png', 1.0);
                    diagramDimensions = {
                        width: finalCanvas.width,
                        height: finalCanvas.height
                    };
                } catch (canvasErr) {
                    console.warn('No se pudo capturar el canvas del árbol para Word', canvasErr);
                }
            }

            await downloadIncidentWordDocument({
                accident: selectedAccident,
                analysis: analysisResult,
                diagramImageBase64: diagramBase64,
                diagramImageDimensions: diagramDimensions
            });
        } catch (err) {
            console.error("Error generating Word document:", err);
            alert("Hubo un error al generar el documento de Word.");
        } finally {
            setIsPreparingWord(false);
        }
    };

  
  const handleSaveAnalysis = () => {
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        analisis: editableAnalysisText,
        causasRaiz: editableRootCauses,
        accionesCorrectivas: editableAccionesCorrectivas,
      });
    }
    setIsEditingAnalysis(false);
  };

  const handleCancelEdit = () => {
    if (analysisResult) {
        setEditableAnalysisText(analysisResult.analisis);
        setEditableRootCauses(analysisResult.causasRaiz);
        setEditableAccionesCorrectivas(analysisResult.accionesCorrectivas);
    }
    setIsEditingAnalysis(false);
  };

  const handleRootCauseChange = (index: number, value: string) => {
    const newCauses = [...editableRootCauses];
    newCauses[index] = value;
    setEditableRootCauses(newCauses);
  };

  const addRootCause = () => setEditableRootCauses([...editableRootCauses, '']);
  const removeRootCause = (index: number) => setEditableRootCauses(editableRootCauses.filter((_, i) => i !== index));

  const handleActionChange = (index: number, field: keyof CorrectiveActionPlan, value: string) => {
    const newActions = [...editableAccionesCorrectivas];
    (newActions[index] as any)[field] = value;
    setEditableAccionesCorrectivas(newActions);
  };
  const addAction = () => setEditableAccionesCorrectivas([...editableAccionesCorrectivas, { description: '', responsible: '', plannedDate: '' }]);
  const removeAction = (index: number) => setEditableAccionesCorrectivas(editableAccionesCorrectivas.filter((_, i) => i !== index));


  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('es-AR');
  };
  
  const formatYear = (dateStr?: string) => dateStr ? new Date(dateStr).getUTCFullYear() : '';
  const formatMonth = (dateStr?: string) => dateStr ? new Date(dateStr).getUTCMonth() + 1 : '';
  const formatDay = (dateStr?: string) => dateStr ? new Date(dateStr).getUTCDate() : '';


  return (
    <>
    <Card>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Historial de Accidentes / Incidentes</h2>
            <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant={viewMode === 'table' ? 'primary' : 'secondary'} onClick={() => setViewMode('table')} className="!px-3 !py-1.5">
                    <TableIcon className="h-5 w-5 mr-2" />
                    Vista de Tabla
                </Button>
                <Button size="sm" variant={viewMode === 'dashboard' ? 'primary' : 'secondary'} onClick={() => setViewMode('dashboard')} className="!px-3 !py-1.5">
                    <DashboardIcon className="h-5 w-5 mr-2" />
                    Perfil de Accidentes
                </Button>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setIsAnalysisModalOpen(true)}>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Analizar Datos con IA
            </Button>
            <Button variant="secondary" onClick={handleImportClick}>
                <UploadIcon className="h-5 w-5 mr-2" />
                Importar Datos
            </Button>
            <Button variant="secondary" onClick={handleExport}>
                <DownloadIcon className="h-5 w-5 mr-2" />
                Exportar a Excel
            </Button>
            <Button variant="primary" onClick={() => onNavigate(View.ACCIDENT_FORM)}>
                <DocumentAddIcon className="h-5 w-5 mr-2" />
                Registrar Nuevo Incidente
            </Button>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      {isImporting && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center space-y-4 mb-6">
            <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                <h3 className="text-lg font-medium text-slate-800">Aguardando...</h3>
            </div>
            <p className="text-sm text-slate-500">Procesando archivo excel y leyendo registros</p>
            <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5">
                <div 
                    className="bg-brand-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${importProgress}%` }}
                ></div>
            </div>
            <p className="text-xs font-semibold text-slate-600">{importProgress}% Completado</p>
        </div>
      )}
      
      {!isImporting && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Input 
                label="Buscar por texto..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="ID, colaborador, sector..."
            />
            <Input 
                label="Filtrar por Legajo"
                value={filterLegajo}
                onChange={(e) => setFilterLegajo(e.target.value)}
                placeholder="Ej: 58215"
            />
            <Input 
                label="Filtrar por Fecha"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
            />
            <Select label="Filtrar por Año" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="">Todos</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
            </Select>
            <Select label="Filtrar por Mes" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
            </Select>
            <MultiSelect 
                label="Filtrar por Sectores" 
                options={[...sectors]}
                selectedValues={filterSectors}
                onChange={(selected) => setFilterSectors(selected)}
            />
            <Select label="Filtrar por Planta" value={filterPlant} onChange={e => setFilterPlant(e.target.value)}>
                <option value="">Todas</option>
                {plants.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Filtrar por Tipo Empleado" value={filterEmployeeType} onChange={e => setFilterEmployeeType(e.target.value)}>
                <option value="">Todos</option>
                {employeeTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Filtrar por Clasificación ART" value={filterArtClassification} onChange={e => setFilterArtClassification(e.target.value)}>
                <option value="">Todas</option>
                {artClassifications.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Filtrar por Causal" value={filterCausal} onChange={e => setFilterCausal(e.target.value)}>
                <option value="">Todas</option>
                {causals.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
        </div>

        {viewMode === 'table' ? (
        <>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                {[
                    "Acciones", "N°", "Año", "Mes", "Día", "Hora", "Turno", "Planta", "Tipo Empleado", "Empresa Contratista", "Apellido y Nombre", "Legajo", "F. Ingreso", "Antigüedad",
                    "Género", "Clasificación", "Tipo", "Sector", "Lugar del Accidente", "Puesto de Trabajo", "Supervisor",
                    "Tipo de Lesión", "Agente Material", "Parte del Cuerpo", "Descripción", "Tarea", "Causal",
                    "Acciones Correctivas", "Fecha Alta", "Días de Baja", "Costo ($)"
                ].map(header => (
                    <th key={header} className="px-3 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">{header}</th>
                ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {paginatedAccidents.map(accident => (
                <tr key={accident.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center space-x-1 justify-center">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="!p-2"
                                onClick={() => handleAnalysisClick(accident)}
                                disabled={isAnalyzing && selectedAccident?.id === accident.id}
                                isLoading={isAnalyzing && selectedAccident?.id === accident.id}
                                title={accident.causeTreeAnalysis ? "Ver o Regenerar Árbol de Causas" : "Generar Árbol de Causas con IA"}
                            >
                            {isAnalyzing && selectedAccident?.id === accident.id ? null : (
                                <SparklesIcon className="h-4 w-4 text-brand-accent" />
                            )}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="!p-2"
                                onClick={() => handleEditClick(accident)}
                                title="Editar Registro"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="!p-2"
                                onClick={() => handleDeleteClick(accident.id, accident.collaboratorName)}
                                title="Eliminar Registro"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900">{accident.id.replace('A-', '').replace('C-','')}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatYear(accident.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatMonth(accident.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatDay(accident.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.time}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.turno || 'N/A'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.planta}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.employeeType}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.contractorCompany || 'N/A'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600 font-medium">{accident.collaboratorName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.legajo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatDate(accident.fechaIngreso)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{calculateSeniority(accident.fechaIngreso, accident.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.genero}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500 font-semibold">{accident.clasificacionART}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.tipo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.sector}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.area}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.puesto}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.supervisor}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.tipoLesion}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.agenteMaterial}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.parteCuerpoAfectada}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-xs" title={accident.description}><div className="w-48 truncate">{accident.description}</div></td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.tareaRutinaria}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{accident.causal}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-xs" title={accident.correctiveActions}><div className="w-48 truncate">{accident.correctiveActions}</div></td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatDate(accident.fechaAltaMedica)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-bold text-center text-red-600">{calculateSickDays(accident.date, accident.fechaAltaMedica, accident.clasificacionART)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500 text-right">{accident.costo ? Number(accident.costo).toLocaleString('es-AR') : '0'}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      
        <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-slate-600">
                Mostrando {paginatedAccidents.length} de {filteredAccidents.length} registros
            </span>
            <div className="flex items-center gap-2">
                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} size="sm">
                    Anterior
                </Button>
                <span className="text-sm text-slate-700 font-medium">
                    Página {currentPage} de {totalPages}
                </span>
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} size="sm">
                    Siguiente
                </Button>
            </div>
        </div>

        {filteredAccidents.length === 0 && (
            <div className="text-center py-10">
                <p className="text-slate-500">No se encontraron incidentes con los filtros actuales.</p>
            </div>
            )}
        </>
        ) : (
            <AccidentProfileDashboard accidents={filteredAccidents} />
        )}
      </>)}

      {selectedAccident && (
        <Modal
            isOpen={!!selectedAccident}
            onClose={() => setSelectedAccident(null)}
            title={`Análisis de Causa Raíz (IA) - Incidente #${selectedAccident.id}`}
            size="4xl"
        >
            {analysisResult && (
                <div className="flex flex-wrap items-center justify-end gap-2 mb-4 no-print">
                    {!isEditingAnalysis && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={handleDownloadPdf}
                                isLoading={isPreparingPdf}
                                disabled={isPreparingPdf || isPreparingWord}
                                title="Descargar informe en formato PDF"
                            >
                                <PrintIcon className="h-4 w-4 mr-1.5" />
                                PDF
                            </Button>
                            <Button
                                variant="secondary"
                                className="!text-[#185abd] hover:!bg-blue-50 border-[#cbd5e1]"
                                onClick={handleDownloadWord}
                                isLoading={isPreparingWord}
                                disabled={isPreparingPdf || isPreparingWord}
                                title="Descargar informe en formato Microsoft Word (.docx)"
                            >
                                <WordIcon className="h-4 w-4 mr-1.5 text-[#185abd]" />
                                Word (.docx)
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditingAnalysis(true)} disabled={isAnalyzing}>
                                <PencilIcon className="h-4 w-4 mr-1.5" />
                                Editar Análisis
                            </Button>
                        </>
                    )}
                </div>
            )}
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
                    <svg className="animate-spin h-10 w-10 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-brand-dark font-semibold">Analizando con IA...</p>
                    <p className="text-slate-500 text-sm mt-2">Esto puede tardar unos segundos.</p>
                </div>
            ) : analysisResult ? (
              <>
                {isEditingAnalysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <TextArea label="Árbol de Causas (Texto)" value={editableAnalysisText} onChange={(e) => setEditableAnalysisText(e.target.value)} rows={15} />
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Causas Raíz</h4>
                        <div className="space-y-2">
                          {editableRootCauses.map((cause, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input label="" value={cause} onChange={(e) => handleRootCauseChange(index, e.target.value)} />
                              <Button variant="danger" size="sm" className="!px-2" onClick={() => removeRootCause(index)}>&times;</Button>
                            </div>
                          ))}
                        </div>
                        <Button size="sm" variant="secondary" onClick={addRootCause} className="mt-2">+ Añadir Causa</Button>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Plan de Acción Correctiva</h4>
                        <div className="space-y-4">
                            {editableAccionesCorrectivas.map((action, index) => (
                                <div key={index} className="p-3 border rounded-lg bg-slate-100 relative">
                                    <button type="button" onClick={() => removeAction(index)} className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-lg px-2">&times;</button>
                                    <TextArea label={`Descripción Acción #${index + 1}`} value={action.description} onChange={(e) => handleActionChange(index, 'description', e.target.value)} rows={2} />
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Input label="Responsable" value={action.responsible} onChange={(e) => handleActionChange(index, 'responsible', e.target.value)} />
                                        <Input label="Fecha Plan." type="date" value={action.plannedDate} onChange={(e) => handleActionChange(index, 'plannedDate', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button size="sm" variant="secondary" onClick={addAction} className="mt-2">+ Añadir Acción</Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Vista Previa del Diagrama</h4>
                       <div className="border border-slate-200 rounded-lg p-2 bg-white overflow-hidden">
                          <CauseTreeDiagram analysisText={editableAnalysisText} key={editableAnalysisText} />
                       </div>
                    </div>
                  </div>
                ) : (
                  <div id="analysis-modal-content" className="space-y-6">
                      <Card title="Hecho Último" className="bg-red-50 border border-red-200">
                           <p className="text-red-800 font-medium">{analysisResult.hechoUltimo}</p>
                      </Card>
                      <Card title="Diagrama de Árbol de Causas">
                          <div className="border border-slate-200 rounded-lg p-2 bg-white overflow-hidden">
                              <CauseTreeDiagram analysisText={analysisResult.analisis} />
                          </div>
                      </Card>
                      <Card title="Causas Raíz Identificadas" className="bg-blue-50 border border-blue-200">
                          <ul className="list-disc list-inside space-y-2 text-blue-800">
                              {analysisResult.causasRaiz.map((causa, index) => (
                                  <li key={index}>{causa}</li>
                              ))}
                          </ul>
                      </Card>
                       <Card title="Plan de Acción Correctiva Propuesto">
                          <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                  <thead className="bg-slate-50">
                                      <tr>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                              Acción Propuesta
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                              Responsable
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                              Fecha Plan.
                                          </th>
                                      </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-slate-200">
                                      {(analysisResult.accionesCorrectivas || []).map((action, index) => (
                                          <tr key={index} className="hover:bg-slate-50">
                                              <td className="px-4 py-3 text-sm text-slate-700">
                                                  {action.description}
                                              </td>
                                              <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                  {action.responsible}
                                              </td>
                                              <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                  {formatDate(action.plannedDate)}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Card>
                  </div>
                )}
              </>
            ) : (
                 <p className="text-center text-red-500 p-8">No se pudo cargar el análisis.</p>
            )}
             </div>
             <div className="flex justify-end space-x-4 pt-4 mt-4 border-t no-print">
                {isEditingAnalysis ? (
                  <>
                    <Button variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveAnalysis}>Guardar Cambios</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setSelectedAccident(null)}>Cerrar</Button>
                    {analysisResult && (
                      <>
                        <Button
                            variant="primary"
                            onClick={handleDownloadPdf}
                            isLoading={isPreparingPdf}
                            disabled={isPreparingPdf || isPreparingWord}
                        >
                            <PrintIcon className="h-5 w-5 mr-2" />
                            Descargar PDF
                        </Button>
                        <Button
                            variant="primary"
                            className="!bg-[#185abd] hover:!bg-[#11499c] !border-[#185abd] text-white shadow-sm"
                            onClick={handleDownloadWord}
                            isLoading={isPreparingWord}
                            disabled={isPreparingPdf || isPreparingWord}
                        >
                            <WordIcon className="h-5 w-5 mr-2" />
                            Descargar Word (.docx)
                        </Button>
                      </>
                    )}
                  </>
                )}
            </div>
        </Modal>
    )}
    {isAnalysisModalOpen && (
        <DataAnalysisModal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            accidentsData={filteredAccidents}
        />
    )}
    {editingAccident && (
        <EditAccidentModal 
            accident={editingAccident}
            onClose={() => setEditingAccident(null)}
            onSave={handleSaveAccident}
        />
    )}

    <ConfirmModal
        isOpen={!!accidentToDelete}
        onClose={() => setAccidentToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Incidente"
        message={`¿Está seguro de que desea eliminar el registro del incidente N° ${accidentToDelete?.id.replace('A-','').replace('C-','')} (${accidentToDelete?.name})?\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
    />

    <ConfirmModal
        isOpen={!!accidentToRegenerate}
        onClose={handleCancelRegenerate}
        onConfirm={handleConfirmRegenerate}
        title="Regenerar Análisis AI"
        message="Ya existe un análisis para este incidente. ¿Desea regenerarlo con IA?"
        confirmText="Regenerar"
        cancelText="Ver Existente"
        confirmVariant="primary"
    />
    </Card>

    {isPreparingPdf && selectedAccident && analysisResult && (
      <div className="printable-pdf-area">
          <div ref={pdfContainerRef} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#1e293b' }}>
              <div data-pdf-block style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00529B', paddingBottom: '8px', marginBottom: '12px' }}>
                  <img src={minervaLogoBase64} alt="Minerva Foods Logo" style={{ height: '32px', maxWidth: '140px', objectFit: 'contain' }} />
                  <div style={{ textAlign: 'right' }}>
                      <h1 data-pdf-heading="true" style={{ fontSize: '15px', fontWeight: 'bold', color: '#002A50', margin: 0 }}>Informe de Investigación de Accidente / Incidente</h1>
                      <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}>Análisis Causa Raíz - Metodología Árbol de Causas</p>
                  </div>
              </div>

              <table data-pdf-block style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <tbody>
                      <tr data-pdf-block>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', width: '18%' }}>Incidente ID:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', width: '32%', fontWeight: '600' }}>{selectedAccident.id}</td>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc', width: '18%' }}>Fecha y Hora:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', width: '32%' }}>{formatDate(selectedAccident.date)} {selectedAccident.time ? `- ${selectedAccident.time}` : ''}</td>
                      </tr>
                      <tr data-pdf-block>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>Planta / Sector:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{selectedAccident.planta || 'Swift'} / {selectedAccident.sector || 'N/A'}</td>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>Supervisor:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{selectedAccident.supervisor || 'N/A'}</td>
                      </tr>
                      <tr data-pdf-block>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>Colaborador:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{selectedAccident.collaboratorName} ({selectedAccident.legajo || 'S/L'})</td>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>Tipo Empleado:</td>
                          <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{selectedAccident.employeeType} {selectedAccident.contractorCompany ? `(${selectedAccident.contractorCompany})` : ''}</td>
                      </tr>
                      <tr data-pdf-block>
                          <td style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>Hecho Último:</td>
                          <td colSpan={3} style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#be123c', background: '#fff1f2' }}>{analysisResult.hechoUltimo}</td>
                      </tr>
                  </tbody>
              </table>

              <div data-pdf-block style={{ marginBottom: '12px' }}>
                  <h2 data-pdf-heading="true" style={{ fontSize: '12px', fontWeight: 'bold', color: '#003F7A', marginTop: '6px', marginBottom: '4px', borderBottom: '1.5px solid #00529B', paddingBottom: '3px' }}>Descripción de lo Sucedido</h2>
                  <div style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '9.5px', marginTop: '4px', backgroundColor: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {selectedAccident.description || 'Sin descripción detallada.'}
                  </div>
              </div>

              <div data-pdf-block style={{ marginBottom: '12px' }}>
                  <h2 data-pdf-heading="true" style={{ fontSize: '12px', fontWeight: 'bold', color: '#003F7A', marginTop: '6px', marginBottom: '4px', borderBottom: '1.5px solid #00529B', paddingBottom: '3px' }}>Diagrama de Árbol de Causas</h2>
                  <div style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#ffffff', marginTop: '4px' }}>
                      <CauseTreeDiagram analysisText={analysisResult.analisis} />
                  </div>
              </div>

              <div data-pdf-block style={{ marginBottom: '12px' }}>
                  <h2 data-pdf-heading="true" style={{ fontSize: '12px', fontWeight: 'bold', color: '#003F7A', marginTop: '6px', marginBottom: '4px', borderBottom: '1.5px solid #00529B', paddingBottom: '3px' }}>Causas Raíz Identificadas</h2>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '22px', fontSize: '9.5px', marginTop: '4px', marginBottom: '4px', lineHeight: '1.4' }}>
                      {analysisResult.causasRaiz.map((causa, index) => (
                          <li data-pdf-block key={index} style={{ marginBottom: '3px', color: '#1e293b' }}>{causa}</li>
                      ))}
                  </ul>
              </div>

              <div data-pdf-block>
                  <h2 data-pdf-heading="true" style={{ fontSize: '12px', fontWeight: 'bold', color: '#003F7A', marginTop: '6px', marginBottom: '4px', borderBottom: '1.5px solid #00529B', paddingBottom: '3px' }}>Plan de Acción Correctiva</h2>
                  <table style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse', marginTop: '4px', border: '1px solid #cbd5e1' }}>
                      <thead>
                          <tr data-pdf-block style={{ background: '#f1f5f9', color: '#334155' }}>
                              <th style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'left', width: '55%' }}>Acción Propuesta</th>
                              <th style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'left', width: '25%' }}>Responsable</th>
                              <th style={{ fontWeight: 'bold', padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '20%' }}>Fecha Planificada</th>
                          </tr>
                      </thead>
                      <tbody>
                          {(analysisResult.accionesCorrectivas || []).map((action, index) => (
                              <tr data-pdf-block key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{action.description}</td>
                                  <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{action.responsible}</td>
                                  <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center', whiteSpace: 'nowrap' }}>{formatDate(action.plannedDate)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    )}

    </>
  );
};

export default AccidentsMatrix;