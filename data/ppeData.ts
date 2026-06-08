import {
    cascoSeguridad,
    cascoConMascara,
    lentesSeguridad,
    proteccionFacial,
    mascaraFacial,
    caretaSoldador,
    mascaraFullFace,
    filtroMascara,
    gorroCuero,
    mentonera,
    proteccionAuditivaEndoaural,
    proteccionAuditivaCopa,
    barbijoDescartable,
    guantesAnticorte,
    guantesMalla,
    guantesNitrilo,
    guantesVaqueta,
    guantesImpacto,
    guantesAlgodon,
    guantesSoldador,
    guantesTemperatura,
    guantesDielectricos,
    sujetaGuantes,
    manoplaAcero,
    manga,
    delantal,
    delantalMalla,
    delantalPvc,
    pechera,
    fajaLumbar,
    camperaCuero,
    ropaBlanca,
    ropaIgnifuga,
    ropaImpermeable,
    chalecoReflectivo,
    ropaFrio,
    botasPvcPuntera,
    botinDielectrico,
    arnesSeguridad,
    caboAmarre,
    equipoAutonomo,
    inercialAnticaida,
    carroViga,
    equipoEstructural,
    neutralizadorAmoniaco,
    fireBall,
    kitBloqueo,
    cajaBloqueo,
    candadoLoto,
    tarjetaLoto,
    cono,
    linterna,
    luzSeguridad,
    soporteExtintor,
} from '../assets/ppeImages';


export interface PpeItem {
    name: string;
    image: string;
}

export const jobTitles: string[] = [
    'Abertura de papada',
    'Abrir tráquea y revisar pulmones',
    'Alimentar roldanas',
    'Arreo de hacienda en manga',
    'Atender necropsia',
    'Atender sala de emergencia',
    'Bajar corazón, pulmón y entraña gruesa',
    'Charqueador',
    'Colocar numero correlativo en garrón',
    'Colocar roldana en pata derecha',
    'Colocar roldana en pata izquierda',
    'Colocar sello correlativo de faena',
    'Control de rechazos',
    'Cortar cuernos con tijera neumática',
    'Cortar manos con tijera neumática',
    'Cortar muñón con tijera neumática',
    'Cortar patas, tirarlas al tubo y rajar cuero de panza',
    'Cortar rabo',
    'Cortar y colgar cabeza en noria',
    'Cuerear capadura lado izquierdo y derecho',
    'Cuerear cara interna de cuartos',
    'Cuerear y rajar pecho',
    'Cuchillero / Despostador',
    'Degollador / Sangrado',
    'Descoyuntar cabeza',
    'Despanzar',
    'Despostador de palco',
    'Desprender lengua y extraer amígdalas',
    'Desprender manos',
    'Destapar cuartos traseros',
    'Extractor de ubre',
    'Extractor de verga',
    'Foguista',
    'Frigorista',
    'Garrear pata izquierda y derecha',
    'Hacer y atar culata con expansor de ligas',
    'Lavar animales en noqueo',
    'Lavar animales previo a faena',
    'Lavar cabeza por boca y fosas nasales',
    'Lavar cabeza por tráquea y esófago',
    'Lavar corrales',
    'Lavar roldanas',
    'Levantar traga pasto con tirabuzón',
    'Liberar manea',
    'Manear animales',
    'Noqueador con martillo neumático',
    'Operación del quemador de gases en sala de necropsia',
    'Operador Hyde Puller',
    'Operador de Autoelevador / Carretilla Eléctrica',
    'Operador de Mezcladoras / Picadoras',
    'Operador de Puente grúas/ Aparejos',
    'Operador de tablero/levantar y encarrilar reses',
    'Operador equipo sopladores',
    'Operador Tunel Dinámico',
    'Operario de Corrales',
    'Operario de Faena',
    'Operario de Producción (Embutidos/Hamburguesas)',
    'Orillar matambre',
    'Personal de Limpieza Industrial',
    'Personal de Mantenimiento',
    'Rajar cuero de pata',
    'Rajar cuero de periné',
    'Recepción y alojamiento de animales en corrales',
    'Revisar hígado',
    'Sacar barbucho',
    'Sacar grasa de pella',
    'Salvar bolsa de hiel',
    'Salvar carne de degolladura y molleja',
    'Salvar cuero de ano, rajar cola y cortar plumero',
    'Salvar grasa riñonada, canal pelviano, nalga interna, capadura, corazón y bola de matambre',
    'Salvar riñón y arrojar a cinta de vísceras',
    'Sellar dentición',
    'Separar pulmón de corazón',
    'Separar tragapasto',
    'Separar tripa de panza',
    'Serruchar pecho',
    'Sierra sin fin de mesa',
    'Supervisor de Planta',
    'Tablerista de Hyde Puller',
    'Trabajo en Altura',
    'Trasladar el animal hacia el pistón de retención',
    'Verificación de caravanas'
].sort();

const ppeList: { [key: string]: PpeItem } = {
    // Protección Personal General
    casco: { name: 'Casco de Seguridad', image: cascoSeguridad },
    botasPvcPuntera: { name: 'Botas PVC con Puntera de Acero', image: botasPvcPuntera },
    lentes: { name: 'Lentes de Policarbonato Antiempañantes', image: lentesSeguridad },

    // Protección de Cabeza y Cara
    cascoConMascara: { name: 'Casco con Máscara de Protección Facial', image: cascoConMascara },
    sobrelentes: { name: 'Sobrelentes para Lentes Recetados', image: lentesSeguridad },
    visorTransparente: { name: 'Visor Transparente de Acrílico', image: proteccionFacial },
    soporteCasco: { name: 'Soporte Plástico Adaptador para Casco', image: soporteExtintor }, // Placeholder icon
    protectorFacialBurbuja: { name: 'Protector Facial tipo Burbuja', image: proteccionFacial },
    protectorFacialArcFlash: { name: 'Protector Facial AF ARC-Flash 12', image: proteccionFacial },
    mascaraFacialCorner: { name: 'Máscara Facial "Corner Corto"', image: mascaraFacial },
    mascaraFullFace: { name: 'Máscara Full Face', image: mascaraFullFace },
    mentonera: { name: 'Mentonera para Casco', image: mentonera },

    // Protección Respiratoria
    filtroMascara: { name: 'Filtro para Máscara (ABEK 2HG/ST)', image: filtroMascara },
    mascarillaConValvula: { name: 'Mascarilla con Válvula (N95)', image: barbijoDescartable },
    barbijoTripleCapa: { name: 'Barbijo Descartable Triple Capa', image: barbijoDescartable },
    equipoAutonomo: { name: 'Equipo de Respiración Autónomo (AIRHAWK)', image: equipoAutonomo },
    
    // Soldadura
    caretaSoldador: { name: 'Careta de Soldador Fotosensible', image: caretaSoldador },
    adaptadorCascoSoldador: { name: 'Kit Adaptador para Casco de Soldador', image: cascoSeguridad },
    camperaCuero: { name: 'Campera de Cuero Descarne para Soldador', image: camperaCuero },
    delantalSoldador: { name: 'Delantal de Cuero para Soldador', image: delantal },
    mangaSoldar: { name: 'Manga de Cuero para Soldar', image: manga },
    gorroCuero: { name: 'Gorro de Cuero Descarne', image: gorroCuero },
    guantesSoldador: { name: 'Guantes de Descarne para Soldador', image: guantesSoldador },
    
    // Protección Auditiva
    auditivaIntraural: { name: 'Protector Auditivo Intraural Ultrafit', image: proteccionAuditivaEndoaural },
    auditivaTrasnuca: { name: 'Protector Auditivo de Copa Trasnuca', image: proteccionAuditivaCopa },
    auditivaCopaCasco: { name: 'Protector Auditivo de Copa para Casco', image: proteccionAuditivaCopa },

    // Protección de Manos
    guantesAlgodon: { name: 'Guantes de Tejido de Algodón', image: guantesAlgodon },
    guantesAnticorteN5: { name: 'Guantes Anticorte Nivel 5 (Spectra G7)', image: guantesAnticorte },
    guantesAnticorteImpacto: { name: 'Guantes Anticorte y Anti-impacto (Exonit 547)', image: guantesImpacto },
    guantesAnticorteKrytech: { name: 'Guantes Anticorte (Krytech 586)', image: guantesAnticorte },
    guantesThermacut: { name: 'Guantes Anticorte Nivel 5 (Thermacut)', image: guantesAnticorte },
    guantesMallaAcero: { name: 'Guantes de Malla de Acero Inoxidable', image: guantesMalla },
    guantesMallaHombro: { name: 'Guante de Malla de Acero hasta el Hombro', image: guantesMalla },
    manoplaAceroSierrero: { name: 'Manopla de Acero para Sierrero (Blade Block)', image: manoplaAcero },
    manoplaAceroInox: { name: 'Manopla de Acero Inoxidable', image: manoplaAcero },
    sujetaGuantes: { name: 'Repuesto Sujeta Guantes para Malla de Acero', image: sujetaGuantes },
    guantesNitrilo: { name: 'Guantes de Nitrilo Azul Flocado', image: guantesNitrilo },
    guantesQuimicos: { name: 'Guantes para Químicos (Solvex 37-185)', image: guantesNitrilo }, // Reusing icon
    guantesLatexRugoso: { name: 'Guantes de Látex Rugoso (Harpon 321v)', image: guantesNitrilo }, // Reusing icon
    guantesVaqueta: { name: 'Guantes de Vaqueta', image: guantesVaqueta },
    guantesDespellejadora: { name: 'Guantes para Despellejadora (67 NFW-10)', image: guantesVaqueta }, // Reusing icon
    guantesFrio: { name: 'Guantes de Cuero para Frío (Hidrófugo/Oleófugo)', image: ropaFrio }, // Reusing icon
    guantesPVCImpacto: { name: 'Guantes de PVC Anti-impacto', image: guantesImpacto },
    guantesTemperatura: { name: 'Guantes para Temperatura (Temp Cook 476)', image: guantesTemperatura },
    guantesDielectricos: { name: 'Guantes Dieléctricos (1000V / Clase 2)', image: guantesDielectricos },

    // Protección Corporal y Ropa
    mangaAnticorte: { name: 'Manga Anticorte Nivel 5', image: manga },
    delantalPVC: { name: 'Delantal de PVC con Refuerzo', image: delantalPvc },
    delantalMalla: { name: 'Delantal de Malla de Acero', image: delantalMalla },
    delantalAnticorte: { name: 'Delantal de Tejido Anticorte', image: delantal },
    pecheraSoftball: { name: 'Pechera tipo Softball', image: pechera },
    fajaLumbar: { name: 'Faja Lumbar', image: fajaLumbar },
    ropaBlanca: { name: 'Ropa de Trabajo (Pantalón y Chaqueta Blanca)', image: ropaBlanca },
    ropaIgnifuga: { name: 'Ropa Ignífuga (Feuer Nomex)', image: ropaIgnifuga },
    ropaImpermeable: { name: 'Ropa Impermeable (Pilotin)', image: ropaImpermeable },
    chalecoReflectivo: { name: 'Chaleco Reflectivo', image: chalecoReflectivo },
    camperaFrio15: { name: 'Campera para Frío (-15°C)', image: ropaFrio },
    jardineroFrio40: { name: 'Jardinero para Congelado (-40°C)', image: ropaFrio },
    camperaFrio40: { name: 'Campera para Congelado (-40°C)', image: ropaFrio },
    camperaAbrigoBlanca: { name: 'Campera de Abrigo Blanca (-15°C)', image: ropaFrio },
    
    // Calzado
    botinDielectrico: { name: 'Botín Dieléctrico', image: botinDielectrico },

    // Trabajos en Altura
    arnesSeguridad: { name: 'Arnés de Seguridad (CR 04)', image: arnesSeguridad },
    caboSujecion: { name: 'Cabo de Amarre de Sujeción', image: caboAmarre },
    caboAmortiguacion: { name: 'Cabo de Amarre con Amortiguación', image: caboAmarre },
    arnesPosicion: { name: 'Arnés de Posicionamiento (CR16)', image: arnesSeguridad },
    cinturonSujecion: { name: 'Cinturón de Sujeción (CR12)', image: caboAmarre },
    inercialAnticaida: { name: 'Dispositivo Inercial Anticaída', image: inercialAnticaida },
    carroViga: { name: 'Carro Ajustable para Vigas', image: carroViga },

    // Emergencia y Varios
    equipoEstructural: { name: 'Equipo Estructural de Brigada', image: equipoEstructural },
    neutralizadorAmoniaco: { name: 'Neutralizador de Amoníaco (NH3)', image: neutralizadorAmoniaco },
    linternaMinero: { name: 'Linterna tipo Minero con Vincha', image: linterna },
    fireBall: { name: 'Elemento de Extinción (Fire Ball)', image: fireBall },
    luzSeguridad: { name: 'Luz de Seguridad para Autoelevador', image: luzSeguridad },
    soporteExtintor: { name: 'Soporte para Extintor', image: soporteExtintor },
    kitBloqueo: { name: 'Kit de Bloqueo y Etiquetado (LOTO)', image: kitBloqueo },
    cajaBloqueo: { name: 'Caja de Bloqueo LOTO', image: cajaBloqueo },
    candadoLoto: { name: 'Candado para Bloqueo LOTO', image: candadoLoto },
    tarjetaLoto: { name: 'Tarjeta de Bloqueo LOTO', image: tarjetaLoto },
    cono: { name: 'Cono de Demarcación', image: cono },
};

const EPP_GENERAL = [ppeList.casco, ppeList.botasPvcPuntera, ppeList.lentes];
const EPP_CUCHILLERO = [...EPP_GENERAL, ppeList.guantesMallaAcero, ppeList.guantesNitrilo, ppeList.mangaAnticorte, ppeList.delantalMalla, ppeList.auditivaTrasnuca];
const EPP_SOLDADOR = [...EPP_GENERAL, ppeList.caretaSoldador, ppeList.guantesSoldador, ppeList.camperaCuero, ppeList.delantalSoldador, ppeList.mangaSoldar, ppeList.gorroCuero, ppeList.auditivaTrasnuca];
const EPP_MANTENIMIENTO = [...EPP_GENERAL, ppeList.guantesNitrilo, ppeList.auditivaTrasnuca, ppeList.ropaBlanca];
const EPP_MANTENIMIENTO_ELECTRICO = [...EPP_MANTENIMIENTO, ppeList.botinDielectrico, ppeList.guantesDielectricos, ppeList.ropaIgnifuga, ppeList.protectorFacialArcFlash];
const EPP_FAENA = [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.guantesNitrilo, ppeList.delantalPVC];
const EPP_TRABAJO_ALTURA = [ppeList.casco, ppeList.botasPvcPuntera, ppeList.arnesSeguridad, ppeList.caboAmortiguacion, ppeList.inercialAnticaida];
const EPP_CORRALES = [ppeList.casco, ppeList.botasPvcPuntera, ppeList.ropaBlanca, ppeList.guantesVaqueta, ppeList.pecheraSoftball];

export const ppeData: Record<string, PpeItem[]> = {
    // Default or undefined jobs get general PPE
    'Default': EPP_GENERAL,

    // Mapped from Document
    'Personal de Mantenimiento': EPP_MANTENIMIENTO,
    'Foguista': [...EPP_MANTENIMIENTO, ppeList.ropaIgnifuga],
    'Frigorista': [...EPP_MANTENIMIENTO, ppeList.ropaFrio, ppeList.guantesFrio],
    'Trabajo en Altura': EPP_TRABAJO_ALTURA,

    'Supervisor de Planta': EPP_GENERAL,
    'Operario de Corrales': EPP_CORRALES,
    'Arreo de hacienda en manga': EPP_CORRALES,
    'Recepción y alojamiento de animales en corrales': EPP_CORRALES,
    
    'Operador de Autoelevador / Carretilla Eléctrica': [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.chalecoReflectivo, ppeList.luzSeguridad, ppeList.soporteExtintor],
    
    // Faena & Despostada (Cuchilleros)
    'Cuchillero / Despostador': EPP_CUCHILLERO,
    'Despostador de palco': EPP_CUCHILLERO,
    'Charqueador': EPP_CUCHILLERO,
    'Abertura de papada': EPP_CUCHILLERO,
    'Abrir tráquea y revisar pulmones': EPP_CUCHILLERO,
    'Bajar corazón, pulmón y entraña gruesa': EPP_CUCHILLERO,
    'Cortar rabo': EPP_CUCHILLERO,
    'Cuerear capadura lado izquierdo y derecho': EPP_CUCHILLERO,
    'Cuerear cara interna de cuartos': EPP_CUCHILLERO,
    'Cuerear y rajar pecho': EPP_CUCHILLERO,
    'Degollador / Sangrado': EPP_CUCHILLERO,
    'Descoyuntar cabeza': EPP_CUCHILLERO,
    'Despanzar': EPP_CUCHILLERO,
    'Desprender lengua y extraer amígdalas': EPP_CUCHILLERO,
    'Desprender manos': EPP_CUCHILLERO,
    'Destapar cuartos traseros': EPP_CUCHILLERO,
    'Extractor de ubre': EPP_CUCHILLERO,
    'Extractor de verga': EPP_CUCHILLERO,
    'Garrear pata izquierda y derecha': EPP_CUCHILLERO,
    'Orillar matambre': EPP_CUCHILLERO,
    'Rajar cuero de pata': EPP_CUCHILLERO,
    'Rajar cuero de periné': EPP_CUCHILLERO,
    'Sacar barbucho': EPP_CUCHILLERO,
    'Sacar grasa de pella': EPP_CUCHILLERO,
    'Salvar bolsa de hiel': EPP_CUCHILLERO,
    'Salvar carne de degolladura y molleja': EPP_CUCHILLERO,
    'Salvar cuero de ano, rajar cola y cortar plumero': EPP_CUCHILLERO,
    'Salvar grasa riñonada, canal pelviano, nalga interna, capadura, corazón y bola de matambre': EPP_CUCHILLERO,
    'Salvar riñón y arrojar a cinta de vísceras': EPP_CUCHILLERO,
    'Separar pulmón de corazón': EPP_CUCHILLERO,
    'Separar tragapasto': EPP_CUCHILLERO,
    'Separar tripa de panza': EPP_CUCHILLERO,
    'Serruchar pecho': EPP_CUCHILLERO,
    'Sierra sin fin de mesa': [...EPP_CUCHILLERO, ppeList.proteccionFacial, ppeList.manoplaAceroSierrero],
    
    // Faena (General)
    'Operario de Faena': EPP_FAENA,
    'Alimentar roldanas': EPP_FAENA,
    'Colocar numero correlativo en garrón': EPP_FAENA,
    'Colocar roldana en pata derecha': EPP_FAENA,
    'Colocar roldana en pata izquierda': EPP_FAENA,
    'Colocar sello correlativo de faena': EPP_FAENA,
    'Control de rechazos': EPP_FAENA,
    'Cortar cuernos con tijera neumática': EPP_FAENA,
    'Cortar manos con tijera neumática': EPP_FAENA,
    'Cortar muñón con tijera neumática': EPP_FAENA,
    'Cortar patas, tirarlas al tubo y rajar cuero de panza': EPP_FAENA,
    'Cortar y colgar cabeza en noria': EPP_FAENA,
    'Hacer y atar culata con expansor de ligas': EPP_FAENA,
    'Lavar animales en noqueo': EPP_FAENA,
    'Lavar animales previo a faena': EPP_FAENA,
    'Lavar cabeza por boca y fosas nasales': EPP_FAENA,
    'Lavar cabeza por tráquea y esófago': EPP_FAENA,
    'Lavar corrales': EPP_FAENA,
    'Lavar roldanas': EPP_FAENA,
    'Levantar traga pasto con tirabuzón': EPP_FAENA,
    'Liberar manea': EPP_FAENA,
    'Manear animales': [...EPP_FAENA, ppeList.pecheraSoftball],
    'Noqueador con martillo neumático': EPP_FAENA,
    'Operador Hyde Puller': EPP_FAENA,
    'Operador de tablero/levantar y encarrilar reses': EPP_FAENA,
    'Revisar hígado': EPP_FAENA,
    'Sellar dentición': EPP_FAENA,
    'Tablerista de Hyde Puller': EPP_FAENA,
    'Trasladar el animal hacia el pistón de retención': EPP_FAENA,
    'Verificación de caravanas': EPP_FAENA,
    
    // Producción
    'Operario de Producción (Embutidos/Hamburguesas)': [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.guantesNitrilo, ppeList.mangaAnticorte, ppeList.delantalPVC, ppeList.mascarillaConValvula],
    'Operador de Mezcladoras / Picadoras': [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.guantesNitrilo, ppeList.mangaAnticorte, ppeList.delantalPVC, ppeList.mascarillaConValvula],
    'Operador equipo sopladores': [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.guantesNitrilo, ppeList.ropaBlanca],
    'Operador Tunel Dinámico': [...EPP_GENERAL, ppeList.auditivaTrasnuca, ppeList.ropaFrio, ppeList.guantesFrio, ppeList.chalecoReflectivo],

    // Limpieza
    'Personal de Limpieza Industrial': [...EPP_GENERAL, ppeList.guantesQuimicos, ppeList.delantalPVC, ppeList.ropaImpermeable, ppeList.proteccionFacial, ppeList.mascarillaConValvula],

    // Resto
    'Atender necropsia': [...EPP_FAENA, ppeList.mascaraFullFace, ppeList.filtroMascara, ppeList.ropaImpermeable],
    'Atender sala de emergencia': [...EPP_FAENA, ppeList.mascaraFullFace, ppeList.filtroMascara, ppeList.ropaImpermeable],
    'Operación del quemador de gases en sala de necropsia': [...EPP_FAENA, ppeList.mascaraFullFace, ppeList.filtroMascara],
    'Operador de Puente grúas/ Aparejos': [...EPP_MANTENIMIENTO, ppeList.guantesVaqueta],

};

// Populate empty job titles with a default set to avoid errors
jobTitles.forEach(job => {
    if (!ppeData[job]) {
        ppeData[job] = ppeData['Default'];
    }
});