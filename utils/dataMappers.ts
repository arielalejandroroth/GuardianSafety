import { AccidentReport, ArtClassification, IncidentType, Gender, TaskType, Causal, EmployeeType } from '../types';

const parseInputDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || typeof dateStr !== 'string') return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    let [day, month, year] = parts.map(p => p.padStart(2, '0'));
    if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        year = (yearNum > 50 ? '19' : '20') + year;
    }
    return `${year}-${month}-${day}`;
};

export const mapRawAccidentToReport = (raw: any): AccidentReport => {
    // Performance optimization: Normalize raw object keys once.
    const normalizedRaw = Object.keys(raw).reduce((acc, key) => {
        if (key && typeof key === 'string') {
            const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            acc[normalizedKey] = raw[key];
        }
        return acc;
    }, {} as Record<string, any>);

    const getVal = (...keys: string[]) => {
        for (const key of keys) {
            const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            if (normalizedRaw[normalizedKey] !== undefined && normalizedRaw[normalizedKey] !== null) {
                return normalizedRaw[normalizedKey];
            }
        }
        return undefined;
    };
    
    const getStringVal = (...keys: string[]) => String(getVal(...keys) || '').trim();

    const id = getStringVal('id', 'item', 'n°');
    const anio = getStringVal('año', 'ano');
    const mes = getStringVal('mes');
    const dia = getStringVal('dia', 'día');

    const accidentDate = anio && mes && dia ? `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : new Date().toISOString().split('T')[0];

    const mapEventType = (type: string): IncidentType => {
        const lowerType = (type || '').toLowerCase();
        if (lowerType.includes('itinere')) return IncidentType.IN_ITINERE;
        if (lowerType.includes('reapertura')) return IncidentType.REAPERTURA;
        if (lowerType.includes('enfermedad profesional')) return IncidentType.ENFERMEDAD_PROFESIONAL;
        return IncidentType.ACCIDENTE;
    };

    const causalText = getStringVal('acto_condicion', 'acto / condicion subestandar').toLowerCase();
    const utilizaEppRaw = getStringVal('utiliza_epp').toUpperCase();
    const utilizaEpp: 'SI' | 'NO' | 'N/A' = utilizaEppRaw === 'SI' ? 'SI' : utilizaEppRaw === 'NO' ? 'NO' : 'N/A';
    
    return {
        id: `A-${id}`,
        planta: getStringVal('unidad'),
        date: accidentDate,
        time: getStringVal('hora'),
        sector: getStringVal('sector_colaborador', 'sector del colaborador'),
        area: getStringVal('sector_accidente', 'sector del accidente'),
        lugar: getStringVal('sector_accidente', 'sector del accidente'),
        puesto: getStringVal('puesto', 'puesto de trabajo'),
        employeeType: EmployeeType.PROPIO,
        collaboratorName: getStringVal('apellido_nombre', 'apellido y nombre'),
        legajo: getStringVal('legajo'),
        fechaIngreso: parseInputDate(getStringVal('fecha_ingreso', 'fecha de ingreso')),
        genero: getStringVal('genero', 'género').toUpperCase() === 'MASCULINO' ? Gender.MASCULINO : getStringVal('genero', 'género').toUpperCase() === 'FEMENINO' ? Gender.FEMENINO : Gender.NO_ESPECIFICADO,
        supervisor: getStringVal('supervisor'),
        tipo: mapEventType(getStringVal('tipo_evento', 'tipo de evento')),
        clasificacionART: (getVal('clasificacion_evento', 'clasificacion del evento') as ArtClassification) || ArtClassification.INCIDENTE,
        description: getStringVal('descripcion_ocurrencia', 'descripcion de la ocurrencia: causa directa', 'descripcion de la ocurrencia'),
        tipoLesion: getStringVal('naturaleza_lesion', 'naturaleza / tipo de lesion'),
        parteCuerpoAfectada: getStringVal('region_corporal_afectada', 'region corporal afectada'),
        agenteMaterial: getStringVal('agente_lesional', 'agente lesional / causador'),
        tareaRutinaria: getStringVal('tarea_produccion', 'tarea (produccion): rutinaria - no rutinaria').toLowerCase().includes('no') ? TaskType.NO_RUTINARIA : TaskType.RUTINARIA,
        causal: causalText.includes('acto') ? Causal.ACTO : Causal.CONDICION,
        utilizaEpp: utilizaEpp,
        fechaAltaMedica: parseInputDate(getStringVal('fecha_alta', 'fecha de alta')),
        correctiveActions: 'Verificar acciones en matriz de hallazgos.',
        attachments: [],
    };
};

export const mapRawContractorAccidentToReport = (raw: any): AccidentReport => {
    const accidentDate = `${raw.año}-${String(raw.mes).padStart(2, '0')}-${String(raw.dia).padStart(2, '0')}`;

    const mapEventType = (type: string): IncidentType => {
        const lowerType = (type || '').toLowerCase();
        if (lowerType.includes('itinere')) return IncidentType.IN_ITINERE;
        if (lowerType.includes('enfermedad profesional')) return IncidentType.ENFERMEDAD_PROFESIONAL;
        return IncidentType.ACCIDENTE;
    };
    
    return {
        id: `C-${raw.dni ? String(raw.dni).replace(/\s/g, '-') : Date.now()}`,
        planta: 'ROS',
        date: accidentDate,
        time: raw.hora,
        sector: raw.sector,
        area: raw.sector,
        lugar: raw.sector,
        puesto: 'N/A',
        collaboratorName: raw['apellido_nombre'],
        legajo: raw.dni,
        fechaIngreso: '',
        genero: Gender.NO_ESPECIFICADO,
        supervisor: 'Contratista',
        tipo: mapEventType(raw['tipo_evento']),
        clasificacionART: raw['tipificacion_s/_brasil'] as ArtClassification,
        description: raw['descripcion:_causa_directa'],
        tipoLesion: raw['naturaleza_de_la_lesion'],
        parteCuerpoAfectada: raw['region_corporal'],
        agenteMaterial: raw['agente_lesional'],
        tareaRutinaria: TaskType.RUTINARIA,
        causal: Causal.CONDICION,
        utilizaEpp: 'N/A',
        costo: raw.costo_asociado_usd ? String(raw.costo_asociado_usd) : undefined,
        turno: raw.turno,
        fechaAltaMedica: '',
        correctiveActions: 'A definir por empresa contratista.',
        attachments: [],
        employeeType: EmployeeType.CONTRATISTA,
        contractorCompany: raw.empresa,
    };
};