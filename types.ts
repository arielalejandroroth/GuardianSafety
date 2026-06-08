export enum ActionType {
    INITIALIZE_STATE = 'INITIALIZE_STATE',
    ADD_FINDING = 'ADD_FINDING',
    UPDATE_FINDING = 'UPDATE_FINDING',
    SET_FINDINGS = 'SET_FINDINGS',
    ADD_OBSERVATION = 'ADD_OBSERVATION',
    ADD_AUDIT = 'ADD_AUDIT',
    ADD_ACCIDENT = 'ADD_ACCIDENT',
    UPDATE_ACCIDENT = 'UPDATE_ACCIDENT',
    DELETE_ACCIDENT = 'DELETE_ACCIDENT',
    SET_ACCIDENTS = 'SET_ACCIDENTS',
    ADD_DIALOGUE = 'ADD_DIALOGUE',
    ADD_QUALIFICATION = 'ADD_QUALIFICATION',
    UPDATE_QUALIFICATION = 'UPDATE_QUALIFICATION',
    ADD_FORKLIFT_CHECKLIST = 'ADD_FORKLIFT_CHECKLIST',
    ADD_RISK_EVALUATION = 'ADD_RISK_EVALUATION',
    UPDATE_RISK_EVALUATION = 'UPDATE_RISK_EVALUATION',
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  FORM = 'FORM',
  MATRIX = 'MATRIX',
  AUDIT_FORM = 'AUDIT_FORM',
  AUDITS_MATRIX = 'AUDITS_MATRIX',
  ACCIDENT_FORM = 'ACCIDENT_FORM',
  ACCIDENTS_MATRIX = 'ACCIDENTS_MATRIX',
  DIALOGUE_FORM = 'DIALOGUE_FORM',
  DIALOGUES_MATRIX = 'DIALOGUES_MATRIX',
  QUALIFICATIONS = 'QUALIFICATIONS',
  QUALIFICATION_FORM = 'QUALIFICATION_FORM',
  QUALIFICATION_DETAILS = 'QUALIFICATION_DETAILS',
  QUALIFICATION_CARDS_GALLERY = 'QUALIFICATION_CARDS_GALLERY',
  FORKLIFT_CHECKLIST_FORM = 'FORKLIFT_CHECKLIST_FORM',
  FORKLIFT_CHECKLIST_MATRIX = 'FORKLIFT_CHECKLIST_MATRIX',
  SEGURITO_VISION = 'SEGURITO_VISION',
  EVALUATION_HISTORY = 'EVALUATION_HISTORY',
  PPE_MATRIX = 'PPE_MATRIX',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
}

export enum RiskLevel {
  BAJO = 'Bajo',
  MEDIO = 'Medio',
  ALTO = 'Alto',
}

export enum FindingStatus {
    ABIERTO = 'Abierto',
    EN_EJECUCION = 'En Ejecución',
    CUMPLIDO = 'Cumplido',
    RETRASADO = 'Retrasado',
}

export enum FindingSource {
    OBSERVACION = 'Observación de Comportamiento',
    AUDITORIA_INTERNA = 'Auditoría Interna',
    ACCIDENTE_INCIDENTE = 'Accidente/Incidente',
    HALLAZGO_DIARIO = 'Hallazgo diario',
    CAMINATA_GERENCIAL = 'Caminata Gerencial',
    REPORTE_DIARIO = 'Reporte Diario',
    AUDITORIA_INCENDIO = 'Auditoría Incendio',
    CONTROL_VEHICULAR = 'Control Vehicular SRT 960/15',
}

export interface Attachment {
    name: string;
    type: string;
    data: string; // base64 encoded
}

export interface RiskMarker {
    id: number;
    x: number;
    y: number;
    type: 'high' | 'medium' | 'info';
    label: string;
    icon?: string; // Key for the icon catalog
    scale?: number; // Added for dynamic sizing
    color?: string; // Added for custom coloring
}

export interface UnsafeActs {
  epp: string[];
  procedures: string[];
  personPosition: string[];
  personReaction: string[];
  tools: string[];
}

export interface ObservationFormState {
  id?: string;
  plant: string;
  area: string;
  puesto: string;
  observedInfo: 'Propio' | 'Tercero' | '';
  observationType: 'Programada' | 'Oportunidad' | '';
  unsafeActs: UnsafeActs;
  riskPerception: RiskLevel | '';
  safeBehaviors: string;
  deviationObserved: string;
  immediateCorrection: string;
  observationResult: 'C/Desvío' | 'S/Desvío' | '';
  date: string;
  turn: string;
  sector: string;
  responsibleSector: string;
  observerName: string;
  attachments: Attachment[];
}

export interface Finding {
    id: string;
    plant: string;
    detectionDate: string;
    source: FindingSource;
    sector: string;
    area: string;
    puesto: string;
    deviation: string;
    riskLevel: RiskLevel;
    correctiveAction: string;
    sectorResponsible: string;
    actionResponsible: string;
    plannedDate?: string;
    realizedDate?: string;
    status: FindingStatus;
    observations: string;
    attachments: Attachment[];
}

export interface AuditChecklistItem {
    id: string;
    category: string;
    question: string;
    regulation: string;
    status: 'Si' | 'No' | 'N/A' | '';
    comment: string;
    attachments: Attachment[];
}

export interface InternalAuditFormState {
    plant: string;
    process: string;
    area: string;
    puesto: string;
    sector: string;
    supervisor: string;
    operatorCount: string;
    date: string;
    auditLead: string;
    auditTeam: string;
    checklist: AuditChecklistItem[];
    attachments: Attachment[];
    auditLeadSignature: string;
    supervisorSignature: string;
}

export enum ArtClassification {
    SAM = 'SAM',
    SAF = 'SAF',
    CAF = 'CAF',
    SAMI = 'SAMI',
    SAFI = 'SAFI',
    CAFI = 'CAFI',
    INCIDENTE = 'Incidente',
    REAPERTURA = 'Reapertura',
}

export enum IncidentType {
    ACCIDENTE = 'Accidente',
    IN_ITINERE = 'In Itinere',
    ENFERMEDAD_PROFESIONAL = 'Enfermedad Profesional',
    REAPERTURA = 'Reapertura',
}

export enum Gender {
    MASCULINO = 'Masculino',
    FEMENINO = 'Femenino',
    NO_ESPECIFICADO = 'No Especificado',
}

export enum TaskType {
    RUTINARIA = 'Rutinaria',
    NO_RUTINARIA = 'No Rutinaria',
}

export enum Causal {
    ACTO = 'Acto Inseguro',
    CONDICION = 'Condición Insegura',
}

export enum EmployeeType {
    PROPIO = 'Propio',
    CONTRATISTA = 'Contratista',
}

export interface AccidentFormState {
    planta: string;
    date: string;
    time: string;
    sector: string;
    area: string; 
    lugar: string;
    puesto: string;
    turno?: string;
    
    employeeType: EmployeeType;
    contractorCompany?: string;
    
    collaboratorName: string;
    legajo: string;
    fechaIngreso: string;
    genero: Gender;
    
    supervisor: string;
    tipo: IncidentType;
    clasificacionART: ArtClassification;
    
    description: string;
    
    tipoLesion: string;
    parteCuerpoAfectada: string;
    agenteMaterial: string;

    tareaRutinaria: TaskType;
    causal: Causal;
    utilizaEpp?: 'SI' | 'NO' | 'N/A' | '';
    costo?: string;

    fechaAltaMedica?: string;

    immediateActions?: string;
    correctiveActions: { description: string, responsible: string, date: string }[];
    attachments: Attachment[];
}

export interface AccidentReport extends Omit<AccidentFormState, 'correctiveActions'> {
    id: string;
    correctiveActions: string;
    causeTreeAnalysis?: CauseTreeAnalysis;
}

export enum DialogueType {
    DDS = 'Diálogo Diario de Seguridad (DDS)',
    DSS = 'Diálogo Semanal de Seguridad (DSS)',
    DMS = 'Diálogo Mensual de Seguridad (DMS)',
}

export interface DialogueFormState {
    id: string;
    type: DialogueType;
    date: string;
    sector: string;
    participants: string;
    supervisor: string;
    topics: string;
    attachments: Attachment[];
}

export enum Equipment {
    AUTOELEVADOR = 'Autoelevador',
    CARRETILLA_ELECTRICA = 'Carretilla Eléctrica',
    AMOLADORA = 'Amoladora',
    SIERRA_SIN_FIN = 'Sierra sin fin',
    SIERRA_MEDIA_RESES = 'Sierra media reses',
    EQUIPO_SOPLADORES = 'Operador equipo sopladores',
    MEZCLADORA_PICADORA = 'Operador de Mezcladoras / Picadoras',
    TUNEL_DINAMICO = 'Operador Tunel Dinámico',
    FRIGORISTA = 'Frigorista',
    FOGUISTA = 'Foguista',
    TRABAJO_ALTURA = 'Trabajo en Altura',
    PUENTE_GRUA = 'Operador de Puente grúas/ Aparejos',
}

export enum QualificationStatus {
    VIGENTE = 'Vigente',
    PROXIMO_A_VENCER = 'Próximo a Vencer',
    VENCIDO = 'Vencido',
}

export enum MedicalStatus {
    APTO = 'Apto',
    NO_APTO = 'No Apto',
    CON_RESTRICCIONES = 'Apto con Restricciones',
}

export interface Qualification {
    id: string;
    personnelName: string;
    personnelId: string;
    personnelPhoto?: Attachment;
    supervisor: string;
    sector: string;
    equipment: Equipment;
    issueDate: string;
    expiryDate: string;
    psychophysicalExpiryDate: string;
    medicalCheckupStatus: MedicalStatus;
    observations: string;
    instructor: string;
    attachments: Attachment[];
}

export interface CorrectiveActionPlan {
  description: string;
  responsible: string;
  plannedDate: string;
}

export interface CauseTreeAnalysis {
  hechoUltimo: string;
  analisis: string;
  causasRaiz: string[];
  accionesCorrectivas: CorrectiveActionPlan[];
}

export interface NumberedTreeNode {
  id: number;
  text: string;
  children: NumberedTreeNode[];
}

export interface ForkliftChecklistItem {
    id: string;
    category: string;
    item: string;
    status: 'OK' | 'NOK' | 'N/A' | '';
    observation: string;
    attachments: Attachment[];
}

export interface ForkliftChecklist {
    id: string;
    date: string;
    forkliftNumber: string;
    sector: string;
    controlledBy: string;
    responsibleSignature: string;
    authorized: 'SI' | 'NO' | '';
    generalObservations: string;
    items: ForkliftChecklistItem[];
    hasFindings: boolean;
}

export interface RiskItem {
    item: number;
    sector: string;
    area: string;
    puesto: string;
    tarea: string;
    rutinaria: 'R' | 'N';
    peligros: string;
    riesgo: string;
    frecuenciaExposicion: string;
    control: string;
    consecuencia: string;
    valorFrecuencia: number;
    valorControl: number;
    valorConsecuencia: number;
    nivelRiesgoInicial: number;
    clasificacionRiesgoInicial: string;
    eliminacion: 'SI' | 'NO';
    sustitucion: 'SI' | 'NO';
    controlesIngenieria: 'SI' | 'NO';
    sac: 'SI' | 'NO';
    epp: 'SI' | 'NO';
    detalleControles: string;
    probOcurrenciaFinal: number;
    consecuenciaFinal: number;
    nivelRiesgoFinal: number;
    clasificacionRiesgoFinal: string;
    accionesRequeridas: string;
    procedimiento: string;
}

export interface SafeWorkProcedure {
    codigo: string;
    titulo: string;
    manual: string;
    revision: string;
    fecha: string;
    responsable: string;
    realizado: string;
    revisado: string;
    aprobado: string;
    objetivo: string;
    alcance: string;
    desarrollo: string;
    responsabilidades: string;
    anexos: string;
    documentosReferencia: string;
}

export interface RiskEvaluation {
    id: string;
    date: string;
    sourceType: 'Cámara' | 'Archivo';
    media: Attachment;
    prompt: string;
    risks: RiskItem[];
    procedure?: SafeWorkProcedure;
}

export interface EvacuationRoute {
    id: number;
    points: { x: number, y: number }[];
    type: 'primary' | 'alternative';
    color: string;
}

// AppState for Context
export interface AppState {
    findings: Finding[];
    observations: ObservationFormState[];
    audits: InternalAuditFormState[];
    accidents: AccidentReport[];
    dialogues: DialogueFormState[];
    qualifications: Qualification[];
    forkliftChecklists: ForkliftChecklist[];
    riskEvaluations: RiskEvaluation[];
    isInitialized: boolean;
}

export type Action =
  | { type: ActionType.INITIALIZE_STATE; payload: Omit<AppState, 'isInitialized'> }
  | { type: ActionType.ADD_FINDING; payload: Finding }
  | { type: ActionType.UPDATE_FINDING; payload: Finding }
  | { type: ActionType.SET_FINDINGS; payload: Finding[] }
  | { type: ActionType.ADD_OBSERVATION; payload: ObservationFormState }
  | { type: ActionType.ADD_AUDIT; payload: InternalAuditFormState }
  | { type: ActionType.ADD_ACCIDENT; payload: AccidentReport }
  | { type: ActionType.UPDATE_ACCIDENT; payload: AccidentReport }
  | { type: ActionType.DELETE_ACCIDENT; payload: string } // payload is accident id
  | { type: ActionType.SET_ACCIDENTS; payload: AccidentReport[] }
  | { type: ActionType.ADD_DIALOGUE; payload: DialogueFormState }
  | { type: ActionType.ADD_QUALIFICATION; payload: Qualification }
  | { type: ActionType.UPDATE_QUALIFICATION; payload: Qualification }
  | { type: ActionType.ADD_FORKLIFT_CHECKLIST; payload: ForkliftChecklist }
  | { type: ActionType.ADD_RISK_EVALUATION; payload: RiskEvaluation }
  | { type: ActionType.UPDATE_RISK_EVALUATION; payload: RiskEvaluation };